/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ApolloLink,
  DocumentNode,
  FetchResult,
  Observable,
  Operation
} from '@apollo/client/core'
import { Optional } from '@speckle/shared'
import { merge } from 'lodash-es'
import { PartialDeep } from 'type-fest'
import { ApolloMockData } from '~~/lib/common/helpers/storybook'
import { AddParameters } from '~~/lib/common/helpers/type'

type MockedApolloRequestInput<TVariables = Record<string, any>> = {
  query: DocumentNode
  variables: TVariables
  operationName?: string
}

type MockedApolloResultInput<TVariables = Record<string, any>> = {
  variables: TVariables
}

export type MockedApolloFetchResult<TData = Record<string, any>> = FetchResult<
  ApolloMockData<TData>
>

export type MockedApolloRequest<
  TData = Record<string, any>,
  TVariables = Record<string, any>
> = {
  request: (input: MockedApolloRequestInput<TVariables>) => boolean
  result: (input: MockedApolloResultInput<TVariables>) => MockedApolloFetchResult<TData>
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

export const apolloMockRequest = <
  TData = Record<string, any>,
  TVariables = Record<string, any>
>(
  request: MockedApolloRequest<TData, TVariables>
) => request

export const apolloMockRequestWithDefaults =
  <
    TData = Record<string, any>,
    TVariables = Record<string, any>,
    ExtraValues = Record<string, any> | undefined
  >(defaults: {
    request: AddParameters<
      Parameters<typeof apolloMockRequest<TData, TVariables>>[0]['request'],
      [extra: ExtraValues]
    >
    result: AddParameters<
      Parameters<typeof apolloMockRequest<TData, TVariables>>[0]['result'],
      [extra: ExtraValues]
    >
  }) =>
  (
    values?: ExtraValues,
    params?:
      | Partial<{
          request: Parameters<typeof apolloMockRequest<TData, TVariables>>[0]['request']
          result: (
            input: MockedApolloResultInput<TVariables>
          ) => PartialDeep<FetchResult<ApolloMockData<TData>>>
        }>
      | undefined
  ) =>
    apolloMockRequest<TData, TVariables>({
      request: (input) => {
        if (!defaults.request(input, values || ({} as ExtraValues))) return false
        return params?.request ? params.request(input) : true
      },
      result: (input): FetchResult<ApolloMockData<TData>> => {
        const ret = defaults.result(input, values || ({} as ExtraValues))
        return params?.result ? merge(ret, params.result(input)) : ret
      }
    })
