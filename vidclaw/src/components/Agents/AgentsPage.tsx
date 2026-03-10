import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { X, FileText, Cpu, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

// ─── Agent definitions ───────────────────────────────────────────────────────

interface AgentDef {
  id: string
  name: string
  role: string
  emoji: string
  /** workspace-file names to try in order */
  docFiles: string[]
}

const AGENTS: AgentDef[] = [
  {
    id: "mark",
    name: "Марк",
    role: "Product Manager",
    emoji: "📋",
    docFiles: ["workspace-mark-SOUL.md", "workspace-mark-AGENTS.md"],
  },
  {
    id: "jony",
    name: "Джони",
    role: "CDO / Design",
    emoji: "🎨",
    docFiles: ["workspace-jony-SOUL.md", "workspace-jony-AGENTS.md"],
  },
  {
    id: "pasha",
    name: "Паша",
    role: "Dev",
    emoji: "💻",
    docFiles: ["workspace-pasha-SOUL.md", "workspace-pasha-AGENTS.md"],
  },
  {
    id: "org",
    name: "Орг",
    role: "Orchestrator",
    emoji: "🤖",
    docFiles: ["workspace-org-SOUL.md", "workspace-org-AGENTS.md"],
  },
  {
    id: "steve",
    name: "Стив",
    role: "???",
    emoji: "👤",
    docFiles: ["workspace-steve-SOUL.md", "workspace-steve-AGENTS.md"],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isAgentActive(agentId: string, sessions: { id: string; label: string | null }[]): boolean {
  const lower = agentId.toLowerCase()
  return sessions.some((s) => {
    const label = (s.label ?? "").toLowerCase()
    const id = s.id.toLowerCase()
    return label.includes(lower) || id.includes(lower)
  })
}

// ─── Docs Modal ───────────────────────────────────────────────────────────────

interface DocsModalProps {
  agent: AgentDef
  onClose: () => void
}

function DocsModal({ agent, onClose }: DocsModalProps) {
  const [fileIndex, setFileIndex] = useState(0)
  const fileName = agent.docFiles[fileIndex]

  const { data, isLoading, isError } = useQuery({
    queryKey: ["workspace-file", fileName],
    queryFn: () => api.workspaceFile.get(fileName),
    retry: false,
  })

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  // Try next file if current one errored
  React.useEffect(() => {
    if (isError && fileIndex < agent.docFiles.length - 1) {
      setFileIndex((i) => i + 1)
    }
  }, [isError, fileIndex, agent.docFiles.length])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full max-w-2xl p-4 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{agent.emoji}</span>
            <div>
              <h2 className="text-base font-semibold">{agent.name} — Документы</h2>
              <p className="text-xs text-muted-foreground">{fileName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* File tabs */}
        {agent.docFiles.length > 1 && (
          <div className="flex gap-1 shrink-0">
            {agent.docFiles.map((f, i) => (
              <button
                key={f}
                onClick={() => setFileIndex(i)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  fileIndex === i
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {f.split("-").pop()?.replace(".md", "") ?? f}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Загрузка...</p>
          ) : isError && fileIndex >= agent.docFiles.length - 1 ? (
            <p className="text-sm text-muted-foreground">
              Файл не найден. Агент ещё не инициализирован.
            </p>
          ) : data?.content ? (
            <pre className="text-xs text-foreground/80 whitespace-pre-wrap font-mono leading-relaxed">
              {data.content}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// ─── Model Modal ──────────────────────────────────────────────────────────────

interface ModelModalProps {
  agent: AgentDef
  onClose: () => void
}

function ModelModal({ agent, onClose }: ModelModalProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const { data: models = [], isLoading } = useQuery({
    queryKey: ["models"],
    queryFn: () => api.usage.models(),
  })

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  const handleSave = async () => {
    if (!selected) return
    // Switch global model — in the future could be per-agent
    try {
      await api.usage.switchModel(selected)
      setSaved(true)
      setTimeout(onClose, 1000)
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-t-xl sm:rounded-lg w-full max-w-md p-4 sm:p-6 space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{agent.emoji}</span>
            <h2 className="text-base font-semibold">{agent.name} — Модель</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Model list */}
        <div className="flex-1 overflow-auto min-h-0 space-y-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Загрузка моделей...</p>
          ) : models.length === 0 ? (
            <p className="text-sm text-muted-foreground">Нет доступных моделей</p>
          ) : (
            models.map((model) => (
              <button
                key={model}
                onClick={() => setSelected(model)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors",
                  selected === model
                    ? "bg-primary/15 text-primary font-medium"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {model}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-md border border-border text-muted-foreground hover:bg-accent"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!selected}
            className="px-4 py-2 text-sm rounded-md bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-40 transition-colors"
          >
            {saved ? "Сохранено ✓" : "Применить"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Agent Card ───────────────────────────────────────────────────────────────

interface AgentCardProps {
  agent: AgentDef
  active: boolean
  onDocs: () => void
  onModel: () => void
}

function AgentCard({ agent, active, onDocs, onModel }: AgentCardProps) {
  return (
    <div
      className={cn(
        "border rounded-xl p-4 bg-card/50 flex flex-col gap-4 transition-all hover:border-orange-500/30",
        active ? "border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.08)]" : "border-border"
      )}
    >
      {/* Avatar + status */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0",
              "bg-gradient-to-br",
              active ? "from-emerald-500/20 to-teal-500/20" : "from-zinc-700/40 to-zinc-600/20"
            )}
          >
            {agent.emoji}
          </div>
          <div>
            <p className="font-semibold text-sm">{agent.name}</p>
            <p className="text-xs text-muted-foreground">{agent.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {active ? (
            <CheckCircle2 size={14} className="text-emerald-400" />
          ) : (
            <Circle size={14} className="text-muted-foreground/40" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              active ? "text-emerald-400" : "text-muted-foreground/50"
            )}
          >
            {active ? "Активен" : "Офлайн"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onDocs}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <FileText size={12} />
          Документы
        </button>
        <button
          onClick={onModel}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Cpu size={12} />
          Модель
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [docsAgent, setDocsAgent] = useState<AgentDef | null>(null)
  const [modelAgent, setModelAgent] = useState<AgentDef | null>(null)

  const { data: sessionList } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => api.memory.sessions({ limit: 100 }),
    refetchInterval: 30_000,
  })

  const sessions = sessionList?.sessions ?? []

  const activeCount = AGENTS.filter((a) => isAgentActive(a.id, sessions)).length

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-card/50 border border-border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Всего агентов</p>
          <p className="text-2xl font-bold">{AGENTS.length}</p>
        </div>
        <div className="bg-card/50 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Активны</p>
          <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
        </div>
        <div className="bg-card/50 border border-border rounded-lg p-3 col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Офлайн</p>
          <p className="text-2xl font-bold text-muted-foreground">{AGENTS.length - activeCount}</p>
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            active={isAgentActive(agent.id, sessions)}
            onDocs={() => setDocsAgent(agent)}
            onModel={() => setModelAgent(agent)}
          />
        ))}
      </div>

      {/* Modals */}
      {docsAgent && (
        <DocsModal agent={docsAgent} onClose={() => setDocsAgent(null)} />
      )}
      {modelAgent && (
        <ModelModal agent={modelAgent} onClose={() => setModelAgent(null)} />
      )}
    </div>
  )
}
