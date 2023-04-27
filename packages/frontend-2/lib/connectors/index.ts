export type Tag = {
  name: string
  codeinjection_head: string
  feature_image: string
  slug: string
  url: string
}

export type ConnectorTag = {
  name: string
  docsLink: string
  installLink?: string
  souorceLink: string
  description: string
  communityProvider?: string
  isCommunity: boolean
  stable?: string
  versions: ConnectorVersion[]
  directDownload: boolean
} & Tag

export type ConnectorVersion = {
  Number: string
  Url: string
  Date: string
  Prerelease: string
  Architecture: number
  Os: number
}
