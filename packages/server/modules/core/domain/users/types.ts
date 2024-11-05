import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/userHelper'
import { ServerRoles } from '@speckle/shared'
import type express from 'express'
import type http from 'http'

export type User = UserRecord
export type LimitedUser = LimitedUserRecord

export type UserWithOptionalRole<UserType extends LimitedUserRecord = UserRecord> =
  UserType & {
    /**
     * Available, if query joined this data from server_acl
     * (this can be the server role or stream role depending on how and where this was retrieved)
     */
    role?: ServerRoles
  }

export type UserSignUpContext = {
  /**
   * Set when the user creation is happening in the context of a Web request and is triggered by the user making the request.
   */
  req: express.Request | http.IncomingMessage
  /**
   * Set to true, if user is created because of an invite. Important for tracking.
   */
  isInvite: boolean
  /**
   * Whether user agrees to sign up to newsletter
   */
  newsletterConsent: boolean
}
