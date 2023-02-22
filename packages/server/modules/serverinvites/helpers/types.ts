import { Nullable } from '@/modules/shared/helpers/typeHelper'

export type ServerInviteRecord = {
  id: string
  target: string
  inviterId: string
  createdAt: Date
  used: boolean
  message: Nullable<string>
  resourceTarget: Nullable<string>
  resourceId: Nullable<string>
  role: Nullable<string>
  token: string
}
