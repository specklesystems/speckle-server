import { ProjectCreateArgs } from '@/modules/core/domain/projects/operations'
import {
  ProjectVisibility,
  StreamCreateInput
} from '@/modules/core/graph/generated/graphql'
import { ProjectRecordVisibility } from '@/modules/core/helpers/types'
import { throwUncoveredError } from '@speckle/shared'
import { has, get } from 'lodash-es'

export const isProjectCreateInput = (
  i: StreamCreateInput | ProjectCreateArgs
): i is ProjectCreateArgs => {
  if (!has(i, 'visibility')) return false

  // If its lowercase, its not actually the project create input but the project itself - common mistake in tests
  const visibility = get(i, 'visibility') as string
  return visibility.toUpperCase() === visibility
}

export const mapGqlToDbProjectVisibility = (
  visibility: ProjectVisibility
): ProjectRecordVisibility => {
  switch (visibility) {
    case ProjectVisibility.Public:
    case ProjectVisibility.Unlisted:
      return ProjectRecordVisibility.Public
    case ProjectVisibility.Private:
      return ProjectRecordVisibility.Private
    case ProjectVisibility.Workspace:
      return ProjectRecordVisibility.Workspace
    default:
      throwUncoveredError(visibility)
  }
}

export const mapDbToGqlProjectVisibility = (
  visibility: ProjectRecordVisibility
): ProjectVisibility => {
  switch (visibility) {
    case ProjectRecordVisibility.Public:
      return ProjectVisibility.Public
    case ProjectRecordVisibility.Private:
      return ProjectVisibility.Private
    case ProjectRecordVisibility.Workspace:
      return ProjectVisibility.Workspace
    default:
      throwUncoveredError(visibility)
  }
}
