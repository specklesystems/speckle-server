import Cookies from 'js-cookie'
import { useRouter, useRoute } from 'vue-router'
import { onMounted } from 'vue'

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const CHALLENGE_KEY = 'speckle_challenge'

export function useAuthManager() {
  const generateChallenge = (): string => {
    let result = ''
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    localStorage.setItem(CHALLENGE_KEY, result) // <-- persist it
    return result
  }

  const getChallenge = (): string | null => {
    return localStorage.getItem(CHALLENGE_KEY)
  }

  return {
    getChallenge,
    generateChallenge
  }
}

export function useAccessCode() {
  const router = useRouter()
  const route = useRoute()

  onMounted(() => {
    const accessCode = route.query.access_code as string | undefined
    if (accessCode) {
      // TODO: Send it to your backend or store it
      console.log('Access code:', accessCode)

      // After processing, redirect to home
      router.replace({ path: '/' })
    }
  })
}

export function storeToken(token: string) {
  Cookies.set('draw_auth_token', token, {
    expires: 7, // days
    secure: true, // only over HTTPS
    sameSite: 'Strict'
  })
}

export function getToken(): string | undefined {
  return Cookies.get('draw_auth_token')
}

export function removeToken(): void {
  Cookies.remove('draw_auth_token')
}
