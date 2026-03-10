import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import HeartbeatTimer from '../Usage/HeartbeatTimer'
import type { Task, Capacity } from '@/types/api'

interface ColumnDef {
  id: string
  title: string
  color: string
}

interface ColumnProps {
  column: ColumnDef
  tasks: Task[]
  onAdd: () => void
  onQuickAdd: (status: string, title: string, skills?: string[], schedule?: string | null, project?: string) => Promise<void>
  onEdit: (task: Task) => void
  onView: (task: Task) => void
  onDelete: (id: string) => void
  onRun: (id: string) => void
  onToggleSchedule: (id: string, enabled: boolean) => void
  onBulkArchive?: (status: string) => void
  onReview?: (taskId: string, action: 'done' | 'rework', comment: string) => void
  capacity?: Capacity
}

export default function Column({ column, tasks, onAdd, onQuickAdd, onEdit, onView, onDelete, onRun, onToggleSchedule, onBulkArchive, onReview, capacity }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map(t => t.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[240px] sm:min-w-[260px] max-w-[320px] flex flex-col rounded-xl bg-card/50 border border-border transition-colors',
        isOver && 'border-primary/50 bg-primary/5'
      )}
    >
      <div className="flex items-center justify-between p-3 border-b border-border relative overflow-visible">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full', column.color)} />
          <span className="text-sm font-medium">{column.title}</span>
          <span className="text-xs text-muted-foreground bg-secondary rounded-full px-1.5">{tasks.length}</span>
          {capacity && capacity.maxConcurrent > 1 && (
            <div className="flex items-center gap-1 ml-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: capacity.maxConcurrent }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      i < capacity.activeCount ? 'bg-amber-400' : 'bg-muted-foreground/30'
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{capacity.activeCount}/{capacity.maxConcurrent}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {column.id === 'done' && tasks.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`Archive all ${tasks.length} completed task(s)?`)) {
                  onBulkArchive?.('done')
                }
              }}
              className="text-muted-foreground hover:text-destructive transition-colors p-0.5 rounded"
              title="Clear all completed tasks"
            >
              <Trash2 size={14} />
            </button>
          )}
          {column.id === 'todo' && <HeartbeatTimer />}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[120px]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <div key={task.id} className="space-y-1">
              <TaskCard task={task} onEdit={onEdit} onView={onView} onDelete={onDelete} onRun={onRun} onToggleSchedule={onToggleSchedule} />
              {column.id === 'needs_review' && onReview && (
                <div className="flex gap-1 px-1">
                  <button
                    onClick={() => {
                      const comment = window.prompt('Approval comment (optional):') || ''
                      onReview(task.id, 'done', comment)
                    }}
                    className="flex-1 text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                  >
                    ✓ Done
                  </button>
                  <button
                    onClick={() => {
                      const comment = window.prompt('Rework instructions:') || ''
                      if (comment) onReview(task.id, 'rework', comment)
                    }}
                    className="flex-1 text-[10px] px-2 py-1 bg-amber-500/20 text-amber-400 rounded hover:bg-amber-500/30 transition-colors"
                  >
                    ↻ Rework
                  </button>
                </div>
              )}
            </div>
          ))}
        </SortableContext>
      </div>

      {(column.id === 'backlog' || column.id === 'todo') && <div className="p-2 border-t border-border/50">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 w-full text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary/50"
        >
          <Plus size={14} />
          <span>Add a card</span>
        </button>
      </div>}
    </div>
  )
}
