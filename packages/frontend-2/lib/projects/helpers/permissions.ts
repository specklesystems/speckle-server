import { Roles } from '@speckle/shared'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export const canEditProject = (project: { role?: MaybeNullOrUndefined<string> }) =>
  ([Roles.Stream.Owner] as Array<MaybeNullOrUndefined<string>>).includes(project.role)

export const canInviteToProject = canEditProject

export const canModifyModels = (project: { role?: MaybeNullOrUndefined<string> }) =>
  (
    [Roles.Stream.Contributor, Roles.Stream.Owner] as Array<
      MaybeNullOrUndefined<string>
    >
  ).includes(project.role)
