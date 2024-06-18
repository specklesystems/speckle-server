declare module '@apollo/client/core' {
  interface DefaultContext {
    /**
     * Whether to skip logging errors caused in this operation
     */
    skipLoggingErrors?:
      | boolean
      | ((err: import('@apollo/client/link/error').ErrorResponse) => boolean)
  }
}

export {}
