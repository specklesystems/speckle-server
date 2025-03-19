type AuthError<ErrorCode extends string> = {
  code: ErrorCode
  message: string,
}

export const defineAuthError = <ErrorCode extends string>(params: { code: ErrorCode, message: string }): AuthError<ErrorCode> => {
  const { code, message } = params

  return {
    code,
    message,
  }
}

export const FooNotFoundError = defineAuthError({ code: 'TEST1', message: 'TEST2' })
