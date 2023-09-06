import { ModelAutomationRun } from '@/modules/core/graph/generated/graphql'

export type ModelAutomationRunGraphQLReturn = Omit<ModelAutomationRun, 'automation'>
