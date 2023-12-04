import { graphql } from '~~/lib/common/generated/gql'
import type {
  ActiveUserAvatarFragment,
  LimitedUserAvatarFragment,
  AppAuthorAvatarFragment
} from '~~/lib/common/generated/gql/graphql'

graphql(`
  fragment AppAuthorAvatar on AppAuthor {
    id
    name
    avatar
  }
`)

graphql(`
  fragment LimitedUserAvatar on LimitedUser {
    id
    name
    avatar
  }
`)

graphql(`
  fragment ActiveUserAvatar on User {
    id
    name
    avatar
  }
`)

export type AvatarUserType =
  | LimitedUserAvatarFragment
  | ActiveUserAvatarFragment
  | AppAuthorAvatarFragment
  | { id: string; name: string; avatar?: string | null }
