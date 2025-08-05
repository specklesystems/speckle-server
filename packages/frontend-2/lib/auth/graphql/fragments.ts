import { graphql } from '~/lib/common/generated/gql'

export const permissionCheckResultFragment = graphql(`
  fragment FullPermissionCheckResult on PermissionCheckResult {
    authorized
    code
    message
    payload
    errorMessage
  }
`)
