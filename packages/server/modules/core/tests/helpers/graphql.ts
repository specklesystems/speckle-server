import { gql } from 'apollo-server-express'

export const createObjectMutation = gql`
  mutation CreateObject($input: ObjectCreateInput!) {
    objectCreate(objectInput: $input)
  }
`
