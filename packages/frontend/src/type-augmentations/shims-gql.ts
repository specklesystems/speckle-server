declare module '*.gql' {
  import { DocumentNode } from '@apollo/client/core'

  const operation: DocumentNode
  export default operation
}
