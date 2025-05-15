import { throwUncoveredError } from '@speckle/shared'
import { ProjectVisibility } from '~/lib/common/generated/gql/graphql'

export const SupportedProjectVisibility = <const>{
  Public: ProjectVisibility.Public,
  Private: ProjectVisibility.Private,
  Workspace: ProjectVisibility.Workspace
}

export type SupportedProjectVisibility =
  (typeof SupportedProjectVisibility)[keyof typeof SupportedProjectVisibility]

export const castToSupportedVisibility = (
  visibility: ProjectVisibility
): SupportedProjectVisibility => {
  switch (visibility) {
    case ProjectVisibility.Public:
    case ProjectVisibility.Unlisted:
      return SupportedProjectVisibility.Public
    case ProjectVisibility.Private:
    case ProjectVisibility.Workspace:
      return visibility
    default:
      throwUncoveredError(visibility)
  }
}
