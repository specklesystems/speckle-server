<template>
  <div>
    <nav class="fixed z-40 top-0 h-14 bg-foundation shadow">
      <div
        class="flex gap-4 items-center justify-between h-full w-screen py-4 pl-3 pr-4"
      >
        <div class="flex items-center truncate">
          <HeaderLogoBlock :active="false" to="/" />
          <HeaderNavLink
            to="/"
            name="Dashboard"
            :separator="true"
            class="hidden md:inline-block"
          />
          <ClientOnly>
            <PortalTarget name="navigation"></PortalTarget>
          </ClientOnly>
        </div>
        <div class="flex items-center gap-2.5 sm:gap-2">
          <ClientOnly>
            <PortalTarget name="secondary-actions"></PortalTarget>
            <PortalTarget name="primary-actions"></PortalTarget>
          </ClientOnly>
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
