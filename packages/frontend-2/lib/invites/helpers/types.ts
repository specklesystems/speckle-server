import type { ServerRoles } from '@speckle/shared'
import type { FormSelectProjects_ProjectFragment } from '~~/lib/common/generated/gql/graphql'

export type InviteServerItem = {
  email: string
  serverRole: ServerRoles
  project?: FormSelectProjects_ProjectFragment
}

export interface InviteServerForm {
  fields: InviteServerItem[]
}
