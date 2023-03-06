import { Roles, StreamRoles } from '@speckle/shared'

export type SelectableStreamRole = StreamRoles | 'delete'

export const roleSelectItems: Record<
  SelectableStreamRole | string,
  { id: SelectableStreamRole; title: string }
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
  },
  ['delete']: {
    id: 'delete',
    title: 'Remove'
  }
}
