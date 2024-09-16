declare global {
  namespace Chai {
    interface Assertion {
      /**
       * Check if GraphQLResponse object has any errors
       * @param messageOrOptions Optionally check if any of the errors contain the specified message
       * or pass an options object to check for specific error properties
       */
      haveGraphQLErrors(
        messageOrOptions?: string | ({ message: string } | { code: string })
      ): void
    }
  }
}

export {}
