import { Roles, StreamRoles } from '@speckle/shared'

export const roleSelectItems: Record<
  StreamRoles | string,
  { id: StreamRoles; title: string }
> = {
  [Roles.Stream.Owner]: {
    id: Roles.Stream.Owner,
    title: 'Owner'
  },
  [Roles.Stream.Contributor]: {
    id: Roles.Stream.Contributor,
    title: 'Can edit'
  },
  [Roles.Stream.Reviewer]: {
    id: Roles.Stream.Reviewer,
    title: 'Can view'
  }
}
