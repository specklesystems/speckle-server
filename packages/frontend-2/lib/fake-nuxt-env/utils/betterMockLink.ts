/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApolloLink,
  DocumentNode,
  FetchResult,
  Observable,
  Operation
} from '@apollo/client/core'
import { Optional } from '@speckle/shared'

type MockedApolloRequestInput<TVariables = Record<string, any>> = {
  query: DocumentNode
  variables: TVariables
  operationName?: string
}

export type MockedApolloRequest<
  TData = Record<string, any>,
  TVariables = Record<string, any>
> = {
  request: (input: MockedApolloRequestInput<TVariables>) => boolean
  result:
    | FetchResult<TData>
    | ((input: MockedApolloRequestInput<TVariables>) => FetchResult<TData>)
}

export class BetterMockLink extends ApolloLink {
  public requests: MockedApolloRequest[]

  constructor(requests: MockedApolloRequest[]) {
    super()
    this.requests = requests
  }

  public request(
    operation: Operation
  ): Observable<
    FetchResult<Record<string, any>, Record<string, any>, Record<string, any>>
  > | null {
    let error: Optional<Error> = undefined
    const input: MockedApolloRequestInput = {
      query: operation.query,
      operationName: operation.operationName || undefined,
      variables: operation.variables
    }
    const req = this.requests.find((r) => r.request(input))
    if (!req) {
      error = new Error('No mocked response found for query')
    }

    return new Observable((observer) => {
      const timer = setTimeout(() => {
        if (error) {
          try {
            // The onError function can return false to indicate that
            // configError need not be passed to observer.error. For
            // example, the default implementation of onError calls
            // observer.error(configError) and then returns false to
            // prevent this extra (harmless) observer.error call.
            if (this.onError(error, observer) !== false) {
              throw error
            }
          } catch (error) {
            observer.error(error)
          }
        } else if (req) {
          // if (req.request) {
          //   observer.error(response.error)
          // } else {
          if (req.result) {
            observer.next(
              typeof req.result === 'function' ? req.result(input) : req.result
            )
          }
          observer.complete()
          // }
        }
      }, 0)

      return () => {
        clearTimeout(timer)
      }
    })
  }
}
