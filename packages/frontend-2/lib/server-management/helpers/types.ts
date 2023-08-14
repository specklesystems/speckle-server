import { Get } from 'type-fest'
import { UserListQuery } from '~~/lib/common/generated/gql/graphql'

export type UserItem = NonNullable<Get<UserListQuery, 'admin.userList.items[0]'>>

export interface CTA {
  type: 'button' | 'link'
  label: string
  action: () => void | Promise<void>
}

export interface Button {
  text: string
  props: { color: string; fullWidth: boolean; outline: boolean }
  onClick: () => void
}
