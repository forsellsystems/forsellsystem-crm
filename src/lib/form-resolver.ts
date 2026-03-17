import { zodResolver } from '@hookform/resolvers/zod'

// Zod v4 + @hookform/resolvers type incompatibility workaround
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formResolver(schema: any): any {
  return zodResolver(schema)
}
