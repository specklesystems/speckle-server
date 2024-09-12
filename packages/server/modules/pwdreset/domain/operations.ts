import { PasswordResetTokenRecord } from '@/modules/pwdreset/repositories'
import { Optional } from '@speckle/shared'

export type EmailOrTokenId = { email?: string; tokenId?: string }

export type GetPendingToken = (
  identity: EmailOrTokenId
) => Promise<Optional<PasswordResetTokenRecord>>

export type CreateToken = (email: string) => Promise<PasswordResetTokenRecord>

export type DeleteTokens = (identity: EmailOrTokenId) => Promise<void>
