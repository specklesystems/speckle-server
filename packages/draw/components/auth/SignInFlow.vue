<template>
  <div
    class="flex items-center justify-center"
    :style="{ height: 'calc(100vh - 3rem)' }"
  >
    <section
      class="w-full max-w-md flex flex-col gap-y-8 items-center mx-auto py-12 px-6 border rounded-2xl border-outline-2 bg-foundation"
    >
      <h1 class="text-xl md:text-3xl font-semibold text-foreground text-center">
        Speckle Solid Broccoli
      </h1>
      <FormButton color="outline" @click="signIn()">Sign In</FormButton>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useAuthManager } from '~/lib/authn/useAuthManager'
const { generateChallenge } = useAuthManager()
const config = useRuntimeConfig()
const signIn = () => {
  const challenge = generateChallenge()
  const authUrl = `https://app.speckle.systems/authn/verify/${config.public.appId}/${challenge}` // TODO: appId from env
  window.location.href = authUrl
}
</script>
