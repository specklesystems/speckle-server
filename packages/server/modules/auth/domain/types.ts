import { ScopeRecord } from '@/modules/auth/helpers/types'
import { ServerAppRecord, UserRecord } from '@/modules/core/helpers/types'

export type FullServerApp = ServerAppRecord & {
  scopes: ScopeRecord[]
  author: Pick<UserRecord, 'id' | 'name' | 'avatar'> | null
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
