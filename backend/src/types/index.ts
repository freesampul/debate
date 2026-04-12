export * from '@debate-app/shared'

// Extend Express Request to carry the verified user from the auth middleware
declare global {
  namespace Express {
    interface Request {
      user: {
        id: string
        email: string
      }
    }
  }
}
