import { randomString } from '~~/lib/common/helpers/random'
import { login as executeLogin } from '~~/lib/auth/services/login'
import { useAuth } from '~/lib/auth/utils/authState'

export function useLogin() {
  const {
    public: { API_ORIGIN }
  } = useRuntimeConfig()
  const authTokenRef = useAuth()

  const challenge = randomString(10)

  const login = async (email: string, password: string) =>
    executeLogin({ email, password, apiOrigin: API_ORIGIN, challenge, authTokenRef })

  return { login }
}
