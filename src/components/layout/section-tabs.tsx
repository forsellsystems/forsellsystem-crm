import Link from 'next/link'
import { cn } from '@/lib/utils'

/**
 * Flikar inom en sida, till skillnad från ListTabs som växlar mellan sidor.
 * Aktiv flik avgörs av anroparen (en query-parameter), så komponenten kan vara
 * en server-komponent och sidan slipper bli klientkod.
 *
 * Flikarna ska heta samma sak som sektionerna de visar. Grupperande namn tvingar
 * läsaren att först lista ut vad som ligger bakom vilket ord.
 */
export function SectionTabs({
  items,
}: {
  items: { label: string; href: string; active: boolean; count?: number }[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 border-b border-[#B8B8B8]/40">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          scroll={false}
          className={cn(
            'flex items-center gap-1.5 border-b-2 py-3 -mb-px font-condensed text-[11px] uppercase tracking-[0.12em] transition-colors',
            item.active
              ? 'border-[#F2BB01] text-[#1A1A1A]'
              : 'border-transparent text-[#6B6B6B] hover:text-[#1A1A1A]'
          )}
        >
          {item.label}
          {/* Siffran visar var innehållet finns utan att man byter flik. */}
          {item.count != null && item.count > 0 && (
            <span className="rounded bg-[#F2F2F0] px-1.5 py-0.5 text-[10px] tabular-nums text-[#6B6B6B]">
              {item.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  )
}
