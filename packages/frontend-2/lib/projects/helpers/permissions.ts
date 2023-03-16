import { MaybeNullOrUndefined, Roles } from '@speckle/shared'

export const canEditProject = (project: { role?: MaybeNullOrUndefined<string> }) =>
  (
    [Roles.Stream.Contributor, Roles.Stream.Owner] as Array<
      MaybeNullOrUndefined<string>
    >
  ).includes(project.role)

export const canModifyModels = canEditProject
