'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface ListTabsProps {
  items: { label: string; href: string }[]
}

export function ListTabs({ items }: ListTabsProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-6 border-b border-[#B8B8B8]/40">
      {items.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'font-condensed text-[11px] tracking-[0.12em] uppercase py-3 -mb-px border-b-2 transition-colors',
              isActive
                ? 'text-[#1A1A1A] border-[#F2BB01]'
                : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
