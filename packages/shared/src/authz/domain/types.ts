export type AuthResult =
  | { authorized: true }
  | {
    authorized: false
    reason: string
  }

export type AuthFunction = (args: AuthFunctionArgs) => Promise<AuthResult>
export type AuthFunctionArgs = { userId: string }

