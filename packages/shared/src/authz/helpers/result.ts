import { AuthResult, CheckResult } from '../domain/types.js'

export const checkResult = {
  pass: (): CheckResult => ({
    ok: true,
    reason: null
  }),
  fail: (reason: string): CheckResult => ({
    ok: false,
    reason
  })
}

export const authResult = {
  authorized: (): AuthResult => ({
    authorized: true,
    status: null,
    statusMessage: null
  }),
  unauthorized: (statusMessage: string): AuthResult => ({
    authorized: false,
    status: 'NotAuthorized',
    statusMessage
  })
}
