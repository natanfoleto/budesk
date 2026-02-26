import { Calendar, Clock,DollarSign } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function RHOverviewPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Recursos Humanos</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folha Total (Mês Atual)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Consulte Relatórios</div>
            <p className="text-xs text-muted-foreground">
              Acesse a aba de Relatórios para análise detalhada
            </p>
          </CardContent>
        </Card>
        
        <Card className="opacity-75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Férias Previstas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Gestão Ativa</div>
            <p className="text-xs text-muted-foreground">
              Acompanhe na aba Férias
            </p>
          </CardContent>
        </Card>
        
        <Card className="opacity-75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">13º Salário</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Provisão</div>
            <p className="text-xs text-muted-foreground">
              Acesse a aba 13º Salário
            </p>
          </CardContent>
        </Card>
        
        <Card className="opacity-75">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Horas / Ponto</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Controle Mensal</div>
            <p className="text-xs text-muted-foreground">
              Acesse a aba de Frequência
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Aqui a gente poderia adicionar gráficos de RH no dashboard */}
      <div className="mt-8 rounded-lg border bg-card p-8 text-center text-muted-foreground">
        Selecione uma opção no menu lateral para gerenciar: Pagamentos, Férias, 13º, Frequência ou Relatórios.
      </div>
    </div>
  )
}
