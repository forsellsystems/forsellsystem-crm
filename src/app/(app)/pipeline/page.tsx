import { getDealsByStage } from '@/lib/queries/deals'
import { getCompaniesForSelect, getResellers } from '@/lib/queries/companies'
import { getActiveUsers } from '@/lib/queries/users'
import { getMachines } from '@/lib/queries/machines'
import { KanbanBoard } from '@/components/pipeline/kanban-board'
import { NewDealDialog } from '@/components/pipeline/new-deal-dialog'

export default async function PipelinePage() {
  const [dealsByStage, companies, resellers, users, machines] = await Promise.all([
    getDealsByStage(),
    getCompaniesForSelect(),
    getResellers(),
    getActiveUsers(),
    getMachines(),
  ])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-[#1A1A1A]">Pipeline</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Överblick över alla aktiva affärer
          </p>
        </div>
        <NewDealDialog
          companies={companies}
          resellers={resellers}
          users={users}
          machines={machines}
        />
      </div>

      <KanbanBoard initialData={dealsByStage} />
    </div>
  )
}
