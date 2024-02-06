<template>
  <div>
    <nav class="fixed z-20 top-0 h-14 bg-foundation shadow hover:shadow-md transition">
      <div class="flex gap-4 items-center justify-between h-full w-screen px-4">
        <div class="flex items-center truncate">
          <HeaderLogoBlock :active="false" to="/" />
          <HeaderNavLink
            to="/"
            name="Dashboard"
            :separator="true"
            class="hidden md:inline-block"
          />
          <PortalTarget name="navigation"></PortalTarget>
        </div>
        <div class="flex items-center gap-2.5 sm:gap-2">
          <PortalTarget name="secondary-actions"></PortalTarget>
          <PortalTarget name="primary-actions"></PortalTarget>
          <!-- Notifications dropdown -->
          <HeaderNavNotifications />
          <FormButton
            v-if="!activeUser"
            :to="loginUrl.fullPath"
            color="invert"
            class="hidden md:flex"
            size="sm"
          >
            Sign In
          </FormButton>
          <!-- Profile dropdown -->
          <HeaderNavUserMenu :login-url="loginUrl" />
        </div>
      </div>
      <PopupsSignIn v-if="!activeUser" />
    </nav>
    <div class="h-16"></div>
  </div>
</template>
<script setup lang="ts">
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { loginRoute } from '~~/lib/common/helpers/route'
import type { Optional } from '@speckle/shared'

const { activeUser } = useActiveUser()
const route = useRoute()
const router = useRouter()

const token = computed(() => route.query.token as Optional<string>)

const loginUrl = computed(() =>
  router.resolve({
    path: loginRoute,
    query: {
      token: token.value || undefined
    }
  })
)
</script>
