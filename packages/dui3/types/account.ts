export type UserInfo = {
  id: string
}
export type ServerInfo = {
  name: string
  url: string
}
export type Account = {
  isDefault: boolean
  token: string
  serverInfo: ServerInfo
  userInfo: UserInfo
}
