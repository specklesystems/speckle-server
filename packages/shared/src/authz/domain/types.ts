export type AuthResult =
  | {
      authorized: true
      status: null
      statusMessage: null
    }
  | {
      authorized: false
      status: 'NotAuthorized'
      statusMessage: string
    }

export type CheckResult =
  | {
      ok: true
      reason: null
    }
  | {
      ok: false
      reason: string
    }
