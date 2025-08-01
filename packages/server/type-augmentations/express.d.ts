import type { AuthContext } from '@/modules/shared/authz'
import type { mixpanel } from '@/modules/shared/utils/mixpanel'

declare module 'express' {
  interface Request {
    context: AuthContext
    mixpanel: ReturnType<typeof mixpanel>
  }
}

declare module 'http' {
  interface IncomingMessage {
    context?: AuthContext
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    context: AuthContext
    mixpanel: ReturnType<typeof mixpanel>
  }
}

export {}
