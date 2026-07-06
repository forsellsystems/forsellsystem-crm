'use client'

import { Button } from '@/components/ui/button'

// Route-level error boundary: turns an uncaught render/query throw into a
// branded Swedish surface with a retry instead of Next's default error page.
export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center animate-fade-in-up">
      <h2 className="font-display text-2xl text-[#1A1A1A]">Något gick fel</h2>
      <p className="max-w-md text-sm text-[#6B6B6B]">
        Ett oväntat fel uppstod när sidan skulle laddas. Försök igen — om det
        kvarstår kan databasen vara tillfälligt otillgänglig.
      </p>
      <Button onClick={reset}>Försök igen</Button>
    </div>
  )
}
