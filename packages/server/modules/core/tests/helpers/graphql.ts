import { gql } from 'graphql-tag'

export const createObjectMutation = gql`
  mutation CreateObject($input: ObjectCreateInput!) {
    objectCreate(objectInput: $input)
  }
`
