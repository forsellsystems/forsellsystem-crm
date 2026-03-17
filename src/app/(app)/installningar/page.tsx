import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { getUsers } from '@/lib/queries/users'
import { USER_ROLES } from '@/lib/constants'
import { UserDialog, EditUserButton } from '@/components/settings/user-dialog'
import { DeleteUserButton } from '@/components/settings/delete-user-button'

export default async function InstallningarPage() {
  const users = await getUsers()

  const getRoleLabel = (role: string) =>
    USER_ROLES.find((r) => r.key === role)?.label ?? role

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-3xl text-[#1A1F1D]">Inställningar</h2>
        <p className="text-sm text-[#6B7672] mt-1">
          Hantera användare och systemkonfiguration
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Användare</CardTitle>
          <UserDialog />
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#6B7672]">
              <Users className="h-12 w-12 mb-4 text-[#B8BFBB]" />
              <p className="text-sm">Inga användare ännu.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#B8BFBB]/40">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${user.is_active ? 'text-[#1A1F1D]' : 'text-[#B8BFBB]'}`}
                      >
                        {user.name}
                      </span>
                      <Badge
                        variant={
                          user.role === 'admin' ? 'default' : 'secondary'
                        }
                      >
                        {getRoleLabel(user.role)}
                      </Badge>
                      {!user.is_active && (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </div>
                    <p className="text-sm text-[#6B7672]">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <EditUserButton user={user} />
                    <DeleteUserButton
                      userId={user.id}
                      userName={user.name}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
