import { UserRecord } from '@/modules/core/helpers/types'
import type { Session, SessionData } from 'express-session'

declare module 'express-session' {
  interface SessionData extends AccSessionData {}
}

declare module 'http' {
  interface IncomingMessage extends AccSessionData {
    /**
     * Not sure why I have to do this, the session type is picked up correctly in some places, but not others
     */
    session: Session & Partial<SessionData>
  }
}

type AccTokens = {
  access_token: string
  refresh_token: string
  token_type: string
  id_token: string
  expires_in: number
}

export type AccSessionData = {
  accTokens?: AccTokens
  codeVerifier?: string
  projectId?: string
}

export type AccSyncItem = {
  id: string
  projectId: string
  modelId: string
  accHubId: string
  accProjectId: string
  accRootFolderUrn: string
  accFileLineageId: string
  accWebhookId?: string
  status: AccSyncItemStatus
  author: UserRecord
  createdAt: Date
  updatedAt: Date
}

export type AccSyncItemStatus = 'SYNC' | 'SYNCING' | 'PAUSED' | 'FAILED'
