import { gql } from 'apollo-server-express'

export const automateValidateAuthCodeQuery = gql`
  query AutomateValidateAuthCode($code: String!) {
    automateValidateAuthCode(code: $code)
  }
`
