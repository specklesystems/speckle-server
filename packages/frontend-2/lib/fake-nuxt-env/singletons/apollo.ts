import { ApolloClient } from '@apollo/client/core'
import { Optional } from '@speckle/shared'
import { UninitializedResourceAccessError } from '~~/lib/core/errors/base'

let client: Optional<ApolloClient<unknown>> = undefined

export function getClient(): ApolloClient<unknown> {
  if (!client) {
    throw new UninitializedResourceAccessError(
      "Attempting to retrieve Apollo client before it's been initialized"
    )
  }

  return client
}

export function setClient(newClient: ApolloClient<unknown>) {
  client = newClient
}
