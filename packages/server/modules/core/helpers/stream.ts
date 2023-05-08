import {
  ProjectCreateInput,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import { has } from 'lodash'

export const isProjectCreateInput = (
  i: StreamCreateInput | ProjectCreateInput
): i is ProjectCreateInput => has(i, 'visibility')
