import { randomString } from '~~/lib/common/helpers/random'
import { login as executeLogin } from '~~/lib/auth/services/login'

export function useLogin() {
  const {
    public: { API_ORIGIN }
  } = useRuntimeConfig()

  const challenge = randomString(10)

  const login = async (email: string, password: string) =>
    executeLogin({ email, password, apiOrigin: API_ORIGIN, challenge })

  return { login }
}
