'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  TouchSensor,
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
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
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

  async function moveCard(cardId: string, direction: 'next' | 'prev') {
    const currentCol = findColumn(cardId)
    if (!currentCol) return

    const stageIndex = PIPELINE_STAGES.findIndex((s) => s.key === currentCol)
    const targetIndex = direction === 'next' ? stageIndex + 1 : stageIndex - 1
    if (targetIndex < 0 || targetIndex >= PIPELINE_STAGES.length) return

    const targetCol = PIPELINE_STAGES[targetIndex].key

    // Optimistic update
    setColumns((prev) => {
      const sourceCards = [...prev[currentCol]]
      const targetCards = [...prev[targetCol]]
      const cardIndex = sourceCards.findIndex((c) => c.id === cardId)
      if (cardIndex < 0) return prev

      const [movedCard] = sourceCards.splice(cardIndex, 1)
      movedCard.stage = targetCol
      targetCards.push(movedCard)

      return { ...prev, [currentCol]: sourceCards, [targetCol]: targetCards }
    })

    try {
      await updateDealStage(cardId, targetCol, 0)
    } catch {
      window.location.reload()
    }
  }

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
    const overCol = columns[overId] ? overId : findColumn(overId)

    if (!activeCol || !overCol || activeCol === overCol) return

    setColumns((prev) => {
      const activeCards = [...prev[activeCol]]
      const overCards = [...prev[overCol]]
      const activeIndex = activeCards.findIndex((c) => c.id === activeId)

      const [movedCard] = activeCards.splice(activeIndex, 1)
      movedCard.stage = overCol

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

    const currentCol = findColumn(activeId)
    const startCol = originColumn
    setOriginColumn(null)

    if (!currentCol) return

    const movedBetweenColumns = startCol !== currentCol

    if (!movedBetweenColumns) {
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-3">
        {PIPELINE_STAGES.map((stage, stageIndex) => {
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
              stageIndex={stageIndex}
              onMoveCard={moveCard}
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
  stageIndex,
  onMoveCard,
}: {
  id: string
  title: string
  color: string
  count: number
  totalValue: number
  cards: DealCard[]
  stageIndex: number
  onMoveCard: (cardId: string, direction: 'next' | 'prev') => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="min-w-0">
      <div className="mb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-condensed text-sm tracking-[0.1em] text-[#1A1A1A] truncate">{title}</h3>
          <span className="text-sm text-[#6B6B6B] bg-[#F2F2F0] px-2 py-0.5 rounded-full shrink-0">
            {count}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="text-xs text-[#6B6B6B] ml-4">
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
          className={`w-full space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
            isOver ? 'bg-[#656565]/10 ring-2 ring-[#656565]/20' : 'bg-[#F2F2F0]/50'
          }`}
        >
          {cards.map((card) => (
            <SortableDealCard
              key={card.id}
              card={card}
              stageIndex={stageIndex}
              onMoveCard={onMoveCard}
            />
          ))}
          {cards.length === 0 && (
            <div className={`flex items-center justify-center min-h-[176px] text-xs ${isOver ? 'text-[#656565]' : 'text-[#B8B8B8]'}`}>
              {isOver ? 'Släpp här' : 'Dra affärer hit'}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableDealCard({
  card,
  stageIndex,
  onMoveCard,
}: {
  card: DealCard
  stageIndex: number
  onMoveCard: (cardId: string, direction: 'next' | 'prev') => void
}) {
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
    <div ref={setNodeRef} style={style} className="w-full" {...attributes} {...listeners}>
      <DealCardComponent
        card={card}
        stageIndex={stageIndex}
        onMoveCard={onMoveCard}
      />
    </div>
  )
}

function DealCardComponent({
  card,
  isDragging,
  stageIndex,
  onMoveCard,
}: {
  card: DealCard
  isDragging?: boolean
  stageIndex?: number
  onMoveCard?: (cardId: string, direction: 'next' | 'prev') => void
}) {
  const isFirst = stageIndex === 0
  const isLast = stageIndex === PIPELINE_STAGES.length - 1

  return (
    <Card
      className={`p-3 cursor-grab active:cursor-grabbing group/card hover:ring-1 hover:ring-[#656565]/30 transition-shadow ${isDragging ? 'shadow-lg ring-2 ring-[#656565]/40' : ''}`}
    >
      <Link href={`/pipeline/${card.id}`} onClick={(e) => isDragging && e.preventDefault()} className="block space-y-2">
        <p className="text-sm font-medium text-[#1A1A1A] truncate group-hover/card:text-[#656565] transition-colors">
          {card.company_name}
        </p>
        {(card.quote_number || card.quote_date) && (
          <div className="flex items-center gap-2 text-xs text-[#6B6B6B]">
            {card.quote_number && <span>#{card.quote_number}</span>}
            {card.quote_date && (
              <span>{new Date(card.quote_date).toLocaleDateString('sv-SE')}</span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          {card.value ? (
            <span className="text-sm font-semibold text-[#656565]">
              {formatCurrency(card.value)}
            </span>
          ) : (
            <span className="text-xs text-[#B8B8B8]">Inget värde</span>
          )}
          {card.responsible_name && (
            <span className="text-xs text-[#6B6B6B] truncate max-w-[80px]">
              {card.responsible_name}
            </span>
          )}
        </div>
        {card.contact_name && (
          <p className="text-xs text-[#6B6B6B]">{card.contact_name}</p>
        )}
        {card.reseller_name && (
          <p className="text-[10px] text-[#D4A301]">via {card.reseller_name}</p>
        )}
      </Link>

        {/* Move buttons */}
        {onMoveCard && !isDragging && (
          <div className="flex items-center justify-between pt-1 border-t border-[#F2F2F0]">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isFirst) onMoveCard(card.id, 'prev') }}
              disabled={isFirst}
              className="p-1 rounded hover:bg-[#F2F2F0] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Flytta bakåt"
            >
              <ChevronLeft className="size-3.5 text-[#6B6B6B]" />
            </button>
            <span className="text-[9px] text-[#B8B8B8] font-condensed tracking-wider">FLYTTA</span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isLast) onMoveCard(card.id, 'next') }}
              disabled={isLast}
              className="p-1 rounded hover:bg-[#F2F2F0] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              title="Flytta framåt"
            >
              <ChevronRight className="size-3.5 text-[#6B6B6B]" />
            </button>
          </div>
        )}
    </Card>
  )
}
