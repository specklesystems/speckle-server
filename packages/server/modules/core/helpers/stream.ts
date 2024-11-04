import { ProjectCreateArgs } from '@/modules/core/domain/projects/operations'
import { StreamCreateInput } from '@/modules/core/graph/generated/graphql'
import { has } from 'lodash'

export const isProjectCreateInput = (
  i: StreamCreateInput | ProjectCreateArgs
): i is ProjectCreateArgs => has(i, 'visibility')
