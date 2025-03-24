type AuthSuccess = {
  authorized: true
}

export type AuthFailure<T> = {
  authorized: false
  error: T
}

export type AuthResult<T> = AuthSuccess | AuthFailure<T>

export const authorized = (): AuthSuccess => ({
  authorized: true
})

export const unauthorized = <T>(error: T): AuthFailure<T> => ({
  authorized: false,
  error
})
