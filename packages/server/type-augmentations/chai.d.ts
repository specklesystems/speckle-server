declare global {
  namespace Chai {
    interface Assertion {
      /**
       * Check if GraphQLResponse object has any errors
       * @param message Optionally check if any of the errors contain the specified message
       */
      haveGraphQLErrors(message?: string): void
    }
  }
}

export {}
