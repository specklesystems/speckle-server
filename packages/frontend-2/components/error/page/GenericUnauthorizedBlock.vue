<template>
  <div class="flex flex-col space-y-8 mt-12">
    <div class="flex flex-col justify-center sm:flex-row sm:space-x-2 items-center">
      <h1 class="text-heading-lg text-foreground">
        You are not authorized to access this {{ resourceType }}
      </h1>
    </div>
    <div
      class="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2 items-center"
    >
      <FormButton full-width color="outline" :to="homeRoute">Go home</FormButton>
      <FormButton v-if="!isLoggedIn" full-width @click="() => goToLogin()">
        Sign in
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
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
