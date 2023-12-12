<template>
  <div class="mt-20 flex flex-col items-center">
    <h1 class="h1 font-bold mb-14">Notice</h1>
    <div class="flex flex-col space-y-24 md:space-y-0 md:flex-row md:items-stretch">
      <div class="w-full md:w-72 lg:w-96 flex flex-col space-y-6 justify-between">
        <div class="h4">
          You've previously registered with your
          <strong>G-mail address</strong>
          and a
          <strong>password.</strong>
          Please use those credentials to log in.
        </div>
        <div class="flex justify-center">
          <FormButton size="xl" :icon-left="ArrowLeftIcon" :to="loginRoute">
            Go to Login
          </FormButton>
        </div>
      </div>
      <div class="hidden md:block border border-foreground my-4 mx-6" />
      <div class="w-full md:w-72 lg:w-96 flex flex-col space-y-6 justify-between">
        <div class="h4">
          After
          <strong>verifying</strong>
          your e-mail address you can use your
          <strong>Google Account</strong>
          to log in directly.
        </div>
        <div class="flex justify-center">
          <FormButton v-if="hasEmail" size="xl" :icon-left="PaperAirplaneIcon">
            Resend Verification
          </FormButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { PaperAirplaneIcon } from '@heroicons/vue/24/outline'
import { ArrowLeftIcon } from '@heroicons/vue/24/solid'
import type { Optional } from '@speckle/shared'
import { loginRoute } from '~/lib/common/helpers/route'

const route = useRoute()
const email = computed(() => route.query.email as Optional<string>)
const hasEmail = computed(() => !!email.value?.length)
</script>
