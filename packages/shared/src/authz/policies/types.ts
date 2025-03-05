
export type AuthFunction = (args: AuthFunctionArgs) => Promise<AuthFunctionResult>
export type AuthFunctionArgs = { userId: string }
export type AuthFunctionResult = boolean | null

export type AuthResult =
  | { authorized: true }
  | {
    authorized: false
    reason: string
  }