import type { AccTokens } from '@/modules/acc/helpers/oidcHelper'
import type { Session, SessionData } from 'express-session'

declare module 'express-session' {
  interface SessionData extends AccSessionData {}
}

declare module 'http' {
  interface IncomingMessage extends AccSessionData {
    session: Session & Partial<SessionData>
  }
}

export type AccSessionData = {
  accTokens?: AccTokens
  codeVerifier?: string
  projectId?: string
}
