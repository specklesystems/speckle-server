import {
  requestResetEmail,
  finalizePasswordReset
} from '~~/lib/auth/services/resetPassword'

export function usePasswordReset() {
  const {
    public: { API_ORIGIN: apiOrigin }
  } = useRuntimeConfig()

  const sendResetEmail = async (email: string) =>
    await requestResetEmail({ email, apiOrigin })

  const finalize = async (password: string, token: string) =>
    await finalizePasswordReset({ password, token, apiOrigin })

  return { sendResetEmail, finalize }
}
