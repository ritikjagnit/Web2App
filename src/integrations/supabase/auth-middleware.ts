import { createMiddleware } from '@tanstack/react-start'

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    return next({
      context: {
        supabase: {},
        userId: 'guest',
        claims: {},
      },
    })
  }
)
