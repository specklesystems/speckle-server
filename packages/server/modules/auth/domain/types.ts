import { ScopeRecord } from '@/modules/auth/helpers/types'
import { ServerAppRecord, UserRecord } from '@/modules/core/helpers/types'

export type UserServerApp = ServerAppRecord & {
  author: Pick<UserRecord, 'id' | 'name' | 'avatar'> | null
}

export type FullServerApp = UserServerApp & {
  scopes: ScopeRecord[]
}

export type ServerAppListItem = Pick<
  FullServerApp,
  | 'id'
  | 'name'
  | 'description'
  | 'redirectUrl'
  | 'termsAndConditionsLink'
  | 'trustByDefault'
  | 'logo'
  | 'author'
>
