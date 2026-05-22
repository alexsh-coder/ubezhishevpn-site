import { createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'
import { googleCallbackFn } from '@/api/oauth'

export const Route = createFileRoute('/auth/google/callback')({
  validateSearch: z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
  }),
  beforeLoad: async ({ search }) => {
    if (search.error || !search.code || !search.state) {
      throw redirect({ to: '/login' })
    }
    try {
      await googleCallbackFn({ data: { code: search.code, state: search.state } })
    } catch {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/dashboard' })
  },
  component: () => null,
})
