
"use client"

interface AuditDiffViewerProps {
  oldData: any
  newData: any
}

export function AuditDiffViewer({ oldData, newData }: AuditDiffViewerProps) {
  // We can use SyntaxHighlighter if available, or just simple pre tags.
  // I'll check if react-syntax-highlighter is installed. If not, I'll fallback to simple styling.
  // Prompt requested "bloco de código visual com o JSON formatado".
  // Installing react-syntax-highlighter is a bit heavy if not needed.
  // I'll stick to a nice custom styled pre block for now to avoid large deps unless requested.
  // Actually, I'll use a simple implementation first.

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h3 className="font-semibold text-red-500">Dados Antigos</h3>
        <div className="rounded-md border bg-muted p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {oldData ? JSON.stringify(oldData, null, 2) : "Nenhum dado anterior"}
          </pre>
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold text-green-500">Dados Novos</h3>
        <div className="rounded-md border bg-muted p-4 overflow-auto max-h-[500px]">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {newData ? JSON.stringify(newData, null, 2) : "Nenhum dado novo"}
          </pre>
        </div>
      </div>
    </div>
  )
}
