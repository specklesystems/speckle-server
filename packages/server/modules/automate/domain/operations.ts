import {
  AutomationRecord,
  AutomationTokenRecord
} from '@/modules/automate/helpers/types'
import { AuthCodePayload } from '@/modules/automate/services/authCode'
import { ProjectAutomationCreateInput } from '@/modules/core/graph/generated/graphql'
import { ContextResourceAccessRules } from '@/modules/core/helpers/token'

export type StoreAutomation = (
  automation: AutomationRecord
) => Promise<AutomationRecord>

export type StoreAutomationToken = (
  automationToken: AutomationTokenRecord
) => Promise<AutomationTokenRecord>

export type CreateStoredAuthCode = (
  params: Omit<AuthCodePayload, 'code'>
) => Promise<AuthCodePayload>

export type CreateAutomation = (params: {
  input: ProjectAutomationCreateInput
  projectId: string
  userId: string
  userResourceAccessRules?: ContextResourceAccessRules
}) => Promise<{ automation: AutomationRecord; token: AutomationTokenRecord }>
