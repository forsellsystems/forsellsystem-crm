'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { PIPELINE_STAGES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { updateDealStage, updateDealSortOrders } from '@/lib/actions/deal-actions'
import type { DealCard } from '@/lib/queries/deals'

interface KanbanBoardProps {
  initialData: Record<string, DealCard[]>
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
  const [columns, setColumns] = useState<Record<string, DealCard[]>>(() => {
    const cols: Record<string, DealCard[]> = {}
    for (const stage of PIPELINE_STAGES) {
      cols[stage.key] = initialData[stage.key] ?? []
    }
    return cols
  })
  const [activeCard, setActiveCard] = useState<DealCard | null>(null)
  const [originColumn, setOriginColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    })
  )

  const findColumn = useCallback(
    (id: string): string | null => {
      if (columns[id]) return id
      for (const [key, cards] of Object.entries(columns)) {
        if (cards.some((c) => c.id === id)) return key
      }
      return null
    },
    [columns]
  )

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const col = findColumn(active.id as string)
    if (!col) return
    setOriginColumn(col)
    const card = columns[col].find((c) => c.id === active.id)
    if (card) setActiveCard(card)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeCol = findColumn(activeId)
    // over can be a column id (droppable) or a card id
    const overCol = columns[overId] ? overId : findColumn(overId)

    if (!activeCol || !overCol || activeCol === overCol) return

    setColumns((prev) => {
      const activeCards = [...prev[activeCol]]
      const overCards = [...prev[overCol]]
      const activeIndex = activeCards.findIndex((c) => c.id === activeId)

      const [movedCard] = activeCards.splice(activeIndex, 1)
      movedCard.stage = overCol

      // If dropping on a card, insert at that position; otherwise append
      const overIndex = overCards.findIndex((c) => c.id === overId)
      const insertIndex = overIndex >= 0 ? overIndex : overCards.length
      overCards.splice(insertIndex, 0, movedCard)

      return { ...prev, [activeCol]: activeCards, [overCol]: overCards }
    })
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over) { setOriginColumn(null); return }

    const activeId = active.id as string
    const overId = over.id as string

    // The card is now in its current column (may have been moved by handleDragOver)
    const currentCol = findColumn(activeId)
    const startCol = originColumn
    setOriginColumn(null)

    if (!currentCol) return

    const movedBetweenColumns = startCol !== currentCol

    if (!movedBetweenColumns) {
      // Reorder within same column
      const cards = columns[currentCol]
      const oldIndex = cards.findIndex((c) => c.id === activeId)
      const newIndex = cards.findIndex((c) => c.id === overId)

      if (oldIndex !== newIndex && newIndex >= 0) {
        const reordered = arrayMove(cards, oldIndex, newIndex)
        setColumns((prev) => ({ ...prev, [currentCol]: reordered }))

        try {
          await updateDealSortOrders(
            reordered.map((c, i) => ({ id: c.id, sort_order: i }))
          )
        } catch {
          setColumns((prev) => ({ ...prev, [currentCol]: cards }))
        }
      }
    } else {
      // Moved between columns — already visually updated by handleDragOver
      const newIndex = columns[currentCol].findIndex((c) => c.id === activeId)

      try {
        await updateDealStage(activeId, currentCol, newIndex >= 0 ? newIndex : 0)
        await updateDealSortOrders(
          columns[currentCol].map((c, i) => ({ id: c.id, sort_order: i }))
        )
      } catch {
        window.location.reload()
      }
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-6 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const cards = columns[stage.key] ?? []
          const totalValue = cards.reduce((sum, c) => sum + (c.value ?? 0), 0)

          return (
            <KanbanColumn
              key={stage.key}
              id={stage.key}
              title={stage.label}
              color={stage.color}
              count={cards.length}
              totalValue={totalValue}
              cards={cards}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeCard ? <DealCardComponent card={activeCard} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

function KanbanColumn({
  id,
  title,
  color,
  count,
  totalValue,
  cards,
}: {
  id: string
  title: string
  color: string
  count: number
  totalValue: number
  cards: DealCard[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-condensed text-[11px] tracking-[0.1em] text-[#1A1F1D]">{title}</h3>
          <span className="text-xs text-[#6B7672] bg-[#F0F2F1] px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-[#6B7672] ml-4">
            {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
        id={id}
      >
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
            isOver ? 'bg-[#50645F]/10 ring-2 ring-[#50645F]/20' : 'bg-[#F0F2F1]/50'
          }`}
        >
          {cards.map((card) => (
            <SortableDealCard key={card.id} card={card} />
          ))}
          {cards.length === 0 && (
            <div className={`text-center py-12 text-xs ${isOver ? 'text-[#50645F]' : 'text-[#B8BFBB]'}`}>
              {isOver ? 'Släpp här' : 'Dra affärer hit'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableDealCard({ card }: { card: DealCard }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: 'card', card } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealCardComponent card={card} />
    </div>
  )
}

function DealCardComponent({
  card,
  isDragging,
}: {
  card: DealCard
  isDragging?: boolean
}) {
  return (
    <Link href={`/pipeline/${card.id}`} onClick={(e) => isDragging && e.preventDefault()}>
      <Card
        className={`p-3 cursor-grab active:cursor-grabbing hover:ring-1 hover:ring-[#50645F]/30 transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-[#50645F]/40' : ''}`}
      >
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#1A1F1D] truncate">
            {card.company_name}
          </p>
          {card.quote_number && (
            <p className="text-xs text-[#6B7672]">#{card.quote_number}</p>
          )}
          <div className="flex items-center justify-between">
            {card.value ? (
              <span className="text-sm font-semibold text-[#50645F]">
                {formatCurrency(card.value)}
              </span>
            ) : (
              <span className="text-xs text-[#B8BFBB]">Inget värde</span>
            )}
            {card.responsible_name && (
              <span className="text-xs text-[#6B7672] truncate max-w-[80px]">
                {card.responsible_name}
              </span>
            )}
          </div>
          {card.contact_name && (
            <p className="text-xs text-[#6B7672]">{card.contact_name}</p>
          )}
          {card.reseller_name && (
            <p className="text-[10px] text-[#C4883A]">via {card.reseller_name}</p>
          )}
        </div>
      </Card>
    </Link>
  )
}
