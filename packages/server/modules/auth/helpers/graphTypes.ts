import {
  ServerAppListItem,
  FullServerApp,
  UserServerApp
} from '@/modules/auth/domain/types'

export type ServerAppGraphQLReturn = FullServerApp | UserServerApp

export type ServerAppListItemGraphQLReturn = ServerAppListItem
