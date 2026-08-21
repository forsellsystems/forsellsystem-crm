import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import {
  getMachine,
  getMachineComponents,
  getMachineFeatures,
  getMachineQuestions,
  getMachineSpecs,
} from '@/lib/queries/machines'
import { getNotes } from '@/lib/queries/notes'
import { DeleteMachineButton } from '@/components/machines/delete-machine-button'
import { MachineDetailCard } from '@/components/machines/machine-detail-card'
import { MachineFeaturesCard } from '@/components/machines/machine-features-card'
import { MachineSpecsCard } from '@/components/machines/machine-specs-card'
import { MachineComponentsCard } from '@/components/machines/machine-components-card'
import { MachineKnowledgeCard } from '@/components/machines/machine-knowledge-card'

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [machine, components, features, specs, questions, notes] = await Promise.all([
    getMachine(id),
    getMachineComponents(id),
    getMachineFeatures(id),
    getMachineSpecs(id),
    getMachineQuestions(id),
    getNotes('machine', id),
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
        <DeleteMachineButton machineId={machine.id} machineName={machine.name} redirectTo="/maskiner" />
      </div>

      {/* Vänsterspalten är produktens egen data: detaljer, features och komponentlista.
          Komponenterna flyttar till högerspalten när de sätter priset — då är de
          prisdrivande och behöver bredden. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <MachineDetailCard machine={machine} />
          <MachineFeaturesCard machineId={machine.id} features={features} />
          {!machine.has_components && (
            <MachineComponentsCard
              machineId={machine.id}
              currency={machine.currency}
              components={components}
              hasComponents={false}
            />
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <MachineSpecsCard machineId={machine.id} specs={specs} />
          {machine.has_components && (
            <MachineComponentsCard
              machineId={machine.id}
              currency={machine.currency}
              components={components}
              hasComponents
            />
          )}
          <MachineKnowledgeCard machineId={machine.id} questions={questions} notes={notes} />
        </div>
      </div>
    </div>
  )
}
