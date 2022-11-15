import { PasswordResetError } from '~~/lib/auth/errors/errors'

type RequestResetEmailParams = {
  email: string
  apiOrigin: string
}

type PasswordResetFinalizationParams = {
  password: string
  token: string
  apiOrigin: string
}

export async function requestResetEmail(params: RequestResetEmailParams) {
  const { email, apiOrigin } = params

  const url = new URL('/auth/pwdreset/request', apiOrigin)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })

  const body = await res.text()
  if (res.status !== 200) {
    throw new PasswordResetError(body)
  }
}

export async function finalizePasswordReset(params: PasswordResetFinalizationParams) {
  const { password, token, apiOrigin } = params

  const url = new URL('/auth/pwdreset/finalize', apiOrigin)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId: token, password })
  })

  const body = await res.text()
  if (res.status !== 200) {
    throw new PasswordResetError(body)
  }
}
