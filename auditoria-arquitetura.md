# Auditoria Estrutural do Sistema Budesk

## 1. Duplicidade de Estruturas e Falta de Centralização

Durante a análise, foram detectados pontos onde lógicas não estão centralizadas ou apresentam potencial duplicidade:

- **Adiantamentos vs Transações**: A criação de um adiantamento (`EmployeeAdvance`) gera manualmente uma transação financeira dentro da sua própria rota (`app/api/employees/[id]/advances/route.ts`). Essa lógica não está reaproveitando um serviço isolado de finanças.
- **Controle de Ponto e Banco de Horas**: O esquema possui a tabela `TimeBank` (Saldo, Débito, Crédito) e `AttendanceRecord` (Registros diários). Essa separação é válida, mas como as regras de negócio vivem dentro dos Handlers, há grande risco da atualização de registros do ponto não refletir corretamente e sincronamente no Banco de Horas.
- **Centros de Custo (Cost Centers) Espalhados**: Em `Maintenance` a coluna se chama `costCenter`, e em `RHPayment` a coluna se chama `centroCusto`. Ambos são campos abertos do tipo `String`. Isso impossibilita a geração de relatórios consolidados por centro de custo sem erro humano de digitação.

## 2. Análise de Separação de Responsabilidades (Módulos)

A estrutura atual não respeita a separação modular de domínio (Domain-Driven Design). 

- **Falta de uma camada de Serviços/Repositórios**: Todo o código está escrito de maneira "monolítica" dentro dos *Route Handlers* do Next.js (`app/api/.../route.ts`).
- **Acoplamento Framework-Regra de Negócio**: Não foram detectadas pastas padrão de Módulos (como `services`, `repositories`, `controllers`, `dtos`).
- **Divisão de Responsabilidade entre Funcionários x RH**: 
  - Dentro do módulo (rotas) de Funcionários, existem lógicas que afetam pagamentos como `advances` (adiantamentos) e `contracts`.
  - O ideal é que o domínio "Employee" seja puramente o cadastro-base do colaborador. Funções financeiras perante o colaborador (adiantamentos) deveriam pertencer ao domínio de "RH" integrado ao "Financeiro".

## 3. Integração com Financeiro (Inconsistências)

Foi identificada a falha gravíssima na centralização dos custos no módulo financeiro:

- **Pagamentos de RH Ocultos do Fluxo de Caixa**: A rota de pagamento de funcionários (`RHPayment`) e a respectiva tabela no prisma NÃO geram uma `FinancialTransaction`. O salário, décimo terceiro e férias processados nunca chegam ao controle de caixa central do sistema.
- **Custos de Uso de Veículo (`VehicleUsage`)**: Há a definição de um `cost: Decimal` de uso do veículo alocado a um serviço/projeto, mas não há um vínculo que deduza ou registre isso como um fluxo ou lançamento financeiro formal dentro do projeto.
- **Contas a Pagar x Transações Manuais**: A tabela `AccountPayable` existe isolada. Faltam vínculos explícitos ou rotinas claras para baixar as parcelas gerando transações financeiras reais centralizadas na `FinancialTransaction`. Adicionalmente, não existe um `AccountReceivable` para controlar as entradas provenientes dos Serviços (`Services`).

## 4. Análise da Modelagem do Banco (Schema Prisma)

- **Falta de Chave Estrangeira (FK) em Rateio de Projetos**: O modelo `ProjectAllocation` possui uma coluna `projetoId String`, porém não existe um relacionamento do Prisma (`@relation(fields: [projetoId], references: [id])`) com o modelo `Service` (que parece ser a entidade que representa um projeto ativo). O dado está solto.
- **Inconsistência de Nomenclatura e Idioma**:
  - Modelos do domínio Base/Operacional/Frota/RH estão nomeados em Inglês (`AttendanceRecord`, `ThirteenthSalary`), porém, seus campos misturam idiomas (ex. `primeiraPaga` vs `secondParcel`).
  - Em `RHPayment`, praticamente toda a modelagem foi feita em Português (`competencia`, `salarioBase`, `horasExtras`), destoando absurdamente do restante da aplicação de `Finance` (ex. `valueInCents`, `paymentMethod`).
- **Valores Monetários**: Existe uma inconsistência na tipagem das moedas. Em alguns lugares (Finance, Employee, Contracts, Maintenance) usa-se `Int (@map("value_in_cents"))`. No módulo de RH, foram usados `Decimal (@db.Decimal(10, 2))`. A falta de padronização dificulta integrações e gera riscos de arredondamento.

## 5. Análise de Serviços e Regras de Negócio

- Lógicas financeiras como "Cálculo do impacto do ponto no Banco de Horas", "Totalização do Pagamento no RH" ou "Lançamentos de Despesa" estão dentro dos Handlers (ex. no `POST`).
- Validações inconsistentes: A criação de um Log de Auditoria (`createAuditLog`) é feita solta dentro de cada bloco de Endpoint. Um esquecimento pelo desenvolvedor ao criar uma rota nova quebrará a confiabilidade da auditoria. O correto seria o uso de *Prisma Extensions* ou um *Logging Service*.

## 6. Estrutura de Pastas Esperada x Atual

Para resolver o problema supracitado, a estrutura atual deve ser migrada e encapsulada isolando o core business.

**Estrutura atual (misturada com framework):**
`app/api/rh/payments/route.ts` - Mistura request HTTP + Validação de Input + Regras de Negócio + Persistência Prisma.

**Recomendação de Estrutura:**
Criar uma pasta unificada do lado do servidor como `src/modules/` ou no nível raiz:
```text
modules/
 ├─ employees/
 ├─ rh/
 │   ├─ controllers/     (lida com requests/responses, extrai payloads)
 │   ├─ services/        (regras de negócio pesadas, cálculos, chamadas transversais a outros módulos)
 │   ├─ repositories/    (abstração do acesso ao Prisma)
 │   ├─ dtos/            (esquemas Zod para validação)
 ├─ finance/
 ├─ fleet/
 ├─ projects/ (services)
```
*Assim, os `app/api/.../route.ts` passariam apenas a rotear para os `Controllers` correspondentes.*

## 7. Preparação para Escalabilidade

- **Limitações estruturais:** A mescla de Tipos Ponto Flutuante e Inteiros para dinheiro (`Decimal` vs `Cents`) pode ser prejudicial para fechar o caixa perfeitamente (DRE).
- Ao não ter uma injeção de dependência/centralização de serviços (ex. `FinanceService.registerCost()`), caso as formas de pagamento evoluam ou surja necessidade de consolidação em tempo real de margem de lucro por projetos, um grande refatoramento manual será necessário em inúmeras rotas isoladas.
- O sistema ainda não gerencia um modelo unificado de "Receitas a Receber" dos Projetos para projeção de fluxo de caixa futuro.

## 8. Conclusão e Prioridades de Refatoração

1. **(Alta Prioridade)** Padronizar todos os campos monetários no banco (Decidir entre Decimais Globais ou Inteiros com Centavos e retificar schema Prisma).
2. **(Alta Prioridade)** Fazer com que aprovação de `RHPayment` gere e alimente as Despesas correspondentes em `FinancialTransaction` via Prisma `$transaction`.
3. **(Alta Prioridade)** Consertar FKs faltantes no banco (ex. `ProjectAllocation -> Service`).
4. **(Média Prioridade)** Padronizar idioma das Tabelas/Colunas para evitar erros de desenvolvimento (remover os Pt-BR se a base optou por Inglês).
5. **(Longo Prazo/Refatoração Constante)** Iniciar a criação da camada `/modules/.../services` transferindo as regras de negócio dos Handlers de API para classes/funções Service independentes.
