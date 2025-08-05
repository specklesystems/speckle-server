/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Result } from 'true-myth'
import { AuthError } from '../domain/authErrors.js'

export type GraphqlPermissionCheckResult = {
  authorized: boolean
  code: string
  message: string
  payload: Record<string, unknown> | null
}

export const toGraphqlResult = (
  authResult: Result<unknown, AuthError<string, any>>
): GraphqlPermissionCheckResult => {
  if (authResult.isOk) {
    return {
      authorized: true,
      code: 'OK',
      message: 'OK',
      payload: null
    }
  } else {
    const error = authResult.error
    return {
      authorized: false,
      code: error.code,
      message: error.message,
      payload: (error.payload || null) as Record<string, unknown> | null
    }
  }
}
