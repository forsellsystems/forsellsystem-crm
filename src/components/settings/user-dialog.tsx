'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { formResolver } from '@/lib/form-resolver'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { USER_ROLES } from '@/lib/constants'
import { userSchema, type UserFormData } from '@/lib/validations'
import { createUser, updateUser } from '@/lib/actions/user-actions'
import type { User } from '@/lib/types/database'

interface UserDialogProps {
  user?: User
  trigger?: React.ReactElement
}

export function UserDialog({ user, trigger }: UserDialogProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!user

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: formResolver(userSchema),
    defaultValues: user
      ? { name: user.name, email: user.email, role: user.role as UserFormData['role'], password: '' }
      : { name: '', email: '', role: 'salesperson', password: '' },
  })

  async function onSubmit(data: UserFormData) {
    try {
      setError(null)
      if (isEditing) {
        await updateUser(user.id, data)
      } else {
        await createUser(data)
      }
      setOpen(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Något gick fel')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger render={trigger} />
      ) : (
        <DialogTrigger render={<Button />}>
          <Plus className="size-4" data-icon="inline-start" />
          Ny användare
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Redigera användare' : 'Ny användare'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="user-name">Namn</Label>
            <Input
              id="user-name"
              placeholder="Förnamn Efternamn"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-[#8B3D3D]">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-email">E-post</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="namn@forsellsystem.se"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-[#8B3D3D]">{errors.email.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-password">
              Lösenord{isEditing && ' (lämna tomt för att behålla)'}
            </Label>
            <Input
              id="user-password"
              type="password"
              placeholder={isEditing ? '••••••' : 'Minst 6 tecken'}
              {...register('password')}
            />
            {errors.password && (
              <p className="text-xs text-[#8B3D3D]">{errors.password.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="user-role">Roll</Label>
            <select
              id="user-role"
              className="flex h-8 w-full rounded-lg border border-border bg-background px-2.5 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              {...register('role')}
            >
              {USER_ROLES.map((role) => (
                <option key={role.key} value={role.key}>
                  {role.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-xs text-[#8B3D3D]">{errors.role.message}</p>
            )}
          </div>

          {error && <p className="text-sm text-[#8B3D3D]">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Sparar...'
                : isEditing
                  ? 'Spara ändringar'
                  : 'Skapa användare'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EditUserButton({ user }: { user: User }) {
  return (
    <UserDialog
      user={user}
      trigger={<Button variant="ghost" size="icon-sm"><Pencil className="size-3.5" /></Button>}
    />
  )
}
