import { Roles } from '@speckle/shared'
import type { MaybeNullOrUndefined } from '@speckle/shared'

export const canInviteToProject = (project: { role?: MaybeNullOrUndefined<string> }) =>
  ([Roles.Stream.Owner] as Array<MaybeNullOrUndefined<string>>).includes(project.role)
