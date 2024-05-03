import {
  AutomationRecord,
  AutomationRevisionRecord
} from '@/modules/automate/helpers/types'
import { AutomateFunction } from '@/modules/core/graph/generated/graphql'

export type AutomateFunctionGraphQLReturn = Pick<
  AutomateFunction,
  | 'id'
  | 'name'
  | 'repo'
  | 'isFeatured'
  | 'description'
  | 'logo'
  | 'tags'
  | 'supportedSourceApps'
>

export type AutomationGraphQLReturn = AutomationRecord

export type AutomationRevisionGraphQLReturn = AutomationRevisionRecord

export type ProjectAutomationMutationsGraphQLReturn = { projectId: string }
