import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Wrench, History, ChevronRight } from 'lucide-react'
import { getUsers } from '@/lib/queries/users'
import { USER_ROLES } from '@/lib/constants'
import { UserDialog, EditUserButton } from '@/components/settings/user-dialog'
import { DeleteUserButton } from '@/components/settings/delete-user-button'
import { FortnoxConnectionCard } from '@/components/settings/fortnox-connection-card'
import { getConnection } from '@/lib/fortnox/store'

export default async function InstallningarPage({
  searchParams,
}: {
  searchParams: Promise<{ fortnox?: string }>
}) {
  const [users, fortnox, { fortnox: fortnoxStatus }] = await Promise.all([
    getUsers(),
    getConnection(),
    searchParams,
  ])

  const getRoleLabel = (role: string) =>
    USER_ROLES.find((r) => r.key === role)?.label ?? role

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="font-display text-3xl text-[#1A1A1A]">Inställningar</h2>
        <p className="text-sm text-[#6B6B6B] mt-1">
          Hantera användare och systemkonfiguration
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            href: '/maskiner',
            icon: Wrench,
            title: 'Maskiner',
            desc: 'Produktkatalog — maskiner och utrustning',
          },
          {
            href: '/logg',
            icon: History,
            title: 'Logg',
            desc: 'Försäljningsaktivitet per dag',
          },
        ].map(({ href, icon: Icon, title, desc }) => (
          <Link key={href} href={href} className="group">
            <Card className="transition-colors group-hover:ring-foreground/20">
              <CardContent className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#F2F2F0]">
                  <Icon className="size-5 text-[#656565]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[#1A1A1A]">{title}</p>
                  <p className="text-xs text-[#6B6B6B] truncate">{desc}</p>
                </div>
                <ChevronRight className="size-4 text-[#B8B8B8] shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <FortnoxConnectionCard
        connected={fortnox !== null}
        companyName={fortnox?.company_name ?? null}
        statusParam={fortnoxStatus}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B6B6B]">Användare</CardTitle>
          <UserDialog />
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#6B6B6B]">
              <Users className="h-12 w-12 mb-4 text-[#B8B8B8]" />
              <p className="text-sm">Inga användare ännu.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#B8B8B8]/40">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${user.is_active ? 'text-[#1A1A1A]' : 'text-[#B8B8B8]'}`}
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
                    <p className="text-sm text-[#6B6B6B]">{user.email}</p>
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
