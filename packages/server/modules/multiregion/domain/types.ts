// TODO: Need to coordinate w/ Iain on how this is actually gonna work
export type RegionServerConfig = {
  /**
   * Full Postgres connection URI (e.g. "postgres://user:password@host:port/dbname")
   */
  connectionUri: string
  /**
   * Acts as a key, needs to be globally unique
   */
  locale: string
}
