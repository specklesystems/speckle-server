declare global {
  namespace Chai {
    interface Assertion {
      /**
       * Check if GraphQLResponse object has any errors
       */
      haveGraphQLErrors(message?: string): void
    }
  }
}

export {}
