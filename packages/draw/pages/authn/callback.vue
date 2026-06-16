<template>
  <div class="flex items-center justify-center"><InfiniteLoading /></div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import Cookies from 'js-cookie'
import { useAuthManager } from '~/lib/authn/useAuthManager'

// TODO: registered app callback should be /authn/callback

const route = useRoute()
const router = useRouter()
const { getChallenge } = useAuthManager()

onMounted(async () => {
  const accessCode = route.query.access_code as string | undefined
  if (accessCode) {
    const challenge = getChallenge()
    const config = useRuntimeConfig()
    const body = {
      appId: config.public.appId,
      appSecret: config.public.appSecret,
      accessCode,
      challenge
    }
    // Exchange the access code for a real token (optional)
    const response = await fetch('https://app.speckle.systems/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const { token } = await response.json()

    // Store it in cookies
    Cookies.set('draw_auth_token', token, {
      expires: 7,
      secure: true,
      sameSite: 'Strict'
    })
  }

  router.replace('/')
})
</script>
