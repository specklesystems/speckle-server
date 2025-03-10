export type AuthResult =
  | { authorized: true }
  | {
      authorized: false
      reason: string
    }
  | null

export type AuthFunction = (args: AuthFunctionArgs) => Promise<AuthResult>
export type AuthFunctionArgs = { userId: string }

export type AuthPolicies = {
  canReadProject: (args: { userId: string; projectId: string }) => Promise<AuthResult>
}
