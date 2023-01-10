import { Request } from 'express'
import { AuthContext } from '@/modules/shared/authz'

declare module 'express' {
  interface RequestWithAuthContext extends Request {
    context: AuthContext
  }
}

export {}
