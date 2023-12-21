import type { MaybeAsync } from '@speckle/shared'
import type { Get } from 'type-fest'
import type { ConcreteComponent } from 'vue'
import type {
  AdminPanelInvitesListQuery,
  AdminPanelProjectsListQuery,
  AdminPanelUsersListQuery
} from '~~/lib/common/generated/gql/graphql'

export type ItemType = UserItem | ProjectItem | InviteItem

export type UserItem = NonNullable<
  Get<AdminPanelUsersListQuery, 'admin.userList.items[0]'>
>
export type ProjectItem = NonNullable<
  Get<AdminPanelProjectsListQuery, 'admin.projectList.items[0]'>
>
export type InviteItem = NonNullable<
  Get<AdminPanelInvitesListQuery, 'admin.inviteList.items[0]'>
>

export interface CTA {
  type: 'button' | 'link' | 'text'
  label: string
  action?: () => MaybeAsync<void>
}

export interface Button {
  text: string
  props: { color: string; fullWidth: boolean; outline: boolean }
  onClick: () => void
}

export interface CardInfo {
  title: string
  value: string
  icon: ConcreteComponent
  cta?: CTA
}
