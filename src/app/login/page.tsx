'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/actions/auth-actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
    } catch (err: unknown) {
      const digest = (err as { digest?: string })?.digest
      if (digest?.includes('NEXT_REDIRECT')) return
      setError(err instanceof Error ? err.message : 'Något gick fel')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A]">
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_30%_40%,#333333_0%,transparent_50%)]" />

      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/forsell-logo-white.png"
            alt="Forsell System"
            width={180}
            height={52}
            className="h-auto w-[180px] opacity-90"
            priority
          />
        </div>

        {/* Login card */}
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl text-[#1A1A1A]">Logga in</h1>
            <p className="text-sm text-[#6B6B6B] mt-1">Forsell System CRM</p>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="login-email">E-post</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="namn@forsellsystem.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="login-password">Lösenord</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[#8B3D3D] text-center">{error}</p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#656565] hover:bg-[#4A4A4A]"
            >
              {isLoading ? 'Loggar in...' : 'Logga in'}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-[#808080] mt-6 font-condensed tracking-[0.15em]">
          FORSELL SYSTEM AB
        </p>
      </div>
    </div>
  )
}
