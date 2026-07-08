import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { getMachine, getMachineComponents } from '@/lib/queries/machines'
import { EditMachineButton } from '@/components/machines/machine-dialog'
import { DeleteMachineButton } from '@/components/machines/delete-machine-button'
import { MachineComponentsCard } from '@/components/machines/machine-components-card'

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [machine, components] = await Promise.all([
    getMachine(id),
    getMachineComponents(id),
  ])

  if (!machine) notFound()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/maskiner">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-3xl text-[#1A1A1A]">{machine.name}</h2>
              {!machine.is_active && <Badge variant="secondary">Inaktiv</Badge>}
            </div>
            <p className="text-sm text-[#6B6B6B] mt-1">{machine.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditMachineButton machine={machine} />
          <DeleteMachineButton machineId={machine.id} machineName={machine.name} redirectTo="/maskiner" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">
                Maskindetaljer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Kategori</span>
                <span>{machine.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Valuta</span>
                <span>{machine.currency}</span>
              </div>
              {machine.description && (
                <div className="pt-1">
                  <p className="text-[#6B6B6B] mb-1">Beskrivning</p>
                  <p className="text-[#1A1A1A] whitespace-pre-wrap">{machine.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <MachineComponentsCard
            machineId={machine.id}
            currency={machine.currency}
            components={components}
          />
        </div>
      </div>
    </div>
  )
}
