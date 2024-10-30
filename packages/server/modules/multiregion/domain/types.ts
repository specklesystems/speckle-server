export type RegionServerConfig = {
  postgres: {
    /**
     * Full Postgres connection URI (e.g. "postgres://user:password@host:port/dbname")
     */
    connectionUri: string
    /**
     * SSL cert, if any
     */
    publicTlsCertificate?: string
  }
}
