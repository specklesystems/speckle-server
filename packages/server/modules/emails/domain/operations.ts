import { EmailVerificationRecord } from '@/modules/emails/repositories'

/**
 * Repositories
 */

export type GetPendingToken = (params: {
  token?: string
  email?: string
}) => Promise<EmailVerificationRecord | undefined>

export type DeleteVerifications = (email: string) => Promise<void>

export type DeleteOldAndInsertNewVerification = (email: string) => Promise<string>

/**
 * Services
 */

export type RequestNewEmailVerification = (emailId: string) => Promise<void>

export type RequestEmailVerification = (userId: string) => Promise<void>
