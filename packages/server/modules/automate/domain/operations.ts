import {
  AutomationRecord,
  AutomationRevisionWithTriggersFunctions,
  AutomationTokenRecord
} from '@/modules/automate/helpers/types'
import { InsertableAutomationRevision } from '@/modules/automate/repositories/automations'
import { AuthCodePayload } from '@/modules/automate/services/authCode'
import { ProjectAutomationCreateInput } from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'

export type StoreAutomation = (
  automation: AutomationRecord
) => Promise<AutomationRecord>

export type StoreAutomationToken = (
  automationToken: AutomationTokenRecord
) => Promise<AutomationTokenRecord>

export type StoreAutomationRevision = (
  revision: InsertableAutomationRevision
) => Promise<AutomationRevisionWithTriggersFunctions>

export type CreateStoredAuthCode = (
  params: Omit<AuthCodePayload, 'code'>
) => Promise<AuthCodePayload>

export type CreateAutomation = (params: {
  input: ProjectAutomationCreateInput
  projectId: string
  userId: string
  userResourceAccessRules?: ContextResourceAccessRules
}) => Promise<{ automation: AutomationRecord; token: AutomationTokenRecord }>

type KeyPair = {
  publicKey: string
  privateKey: string
}

export type GetEncryptionKeyPair = () => Promise<KeyPair>

export type GetEncryptionKeyPairFor = (publicKey: string) => Promise<KeyPair>
