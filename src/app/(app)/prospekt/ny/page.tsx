import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ProspectForm } from '@/components/prospects/prospect-form'

export default function NyttProspektPage() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Link href="/prospekt">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h2 className="font-display text-3xl text-[#1A1F1D]">Nytt prospekt</h2>
      </div>
      <ProspectForm />
    </div>
  )
}
