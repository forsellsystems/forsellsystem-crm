import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'
import { getMachines } from '@/lib/queries/machines'
import { MachineDialog, EditMachineButton } from '@/components/machines/machine-dialog'
import { DeleteMachineButton } from '@/components/machines/delete-machine-button'

export default async function MaskinerPage() {
  const machines = await getMachines()

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1F1D]">Maskiner</h2>
          <p className="text-sm text-[#6B7672] mt-1">
            Produktkatalog — maskiner och utrustning
          </p>
        </div>
        <MachineDialog />
      </div>

      {machines.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-[#6B7672]">
              <Wrench className="h-12 w-12 mb-4 text-[#B8BFBB]" />
              <p className="text-sm">Inga maskiner ännu.</p>
              <p className="text-xs mt-1">
                Klicka på &ldquo;Ny maskin&rdquo; för att lägga till din första.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {Object.entries(
            machines.reduce<Record<string, typeof machines>>(
              (groups, machine) => {
                const cat = machine.category
                if (!groups[cat]) groups[cat] = []
                groups[cat].push(machine)
                return groups
              },
              {}
            )
          ).map(([category, categoryMachines]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-[#B8BFBB]/40">
                  {categoryMachines.map((machine) => (
                    <div
                      key={machine.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#1A1F1D]">
                            {machine.name}
                          </span>
                          {!machine.is_active && (
                            <Badge variant="secondary">Inaktiv</Badge>
                          )}
                        </div>
                        {machine.description && (
                          <p className="text-sm text-[#6B7672]">
                            {machine.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <EditMachineButton machine={machine} />
                        <DeleteMachineButton
                          machineId={machine.id}
                          machineName={machine.name}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
