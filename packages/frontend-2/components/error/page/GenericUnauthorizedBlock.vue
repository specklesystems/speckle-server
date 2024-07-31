<template>
  <div class="flex flex-col space-y-8 mt-12">
    <div class="flex flex-col justify-center sm:flex-row sm:space-x-2 items-center">
      <LockClosedIcon class="w-12 h-12 text-primary shrink-0" />
      <h1 class="text-heading-xl">
        You are not authorized to access this {{ resourceType }}.
      </h1>
    </div>
    <div
      class="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 items-center"
    >
      <FormButton v-if="!isLoggedIn" size="lg" full-width @click="() => goToLogin()">
        Sign in
      </FormButton>
      <FormButton
        size="lg"
        full-width
        :color="isLoggedIn ? 'primary' : 'outline'"
        :to="homeRoute"
      >
        Go home
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { LockClosedIcon } from '@heroicons/vue/24/solid'
import { useRememberRouteAndGoToLogin, homeRoute } from '~/lib/common/helpers/route'

withDefaults(
  defineProps<{
    resourceType: string
  }>(),
  {
    resourceType: 'project'
  }
)

const { isLoggedIn } = useActiveUser()
const goToLogin = useRememberRouteAndGoToLogin()
</script>
