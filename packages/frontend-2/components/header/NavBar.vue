<template>
  <nav
    class="fixed top-0 left-0 w-full h-14 bg-foundation shadow-md shrink-0 border-b border-outline-3"
  >
    <div class="flex gap-4 items-center justify-between h-full w-screen py-4 px-4">
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
    <div class="flex items-center gap-2.5 sm:gap-2">
      <HeaderNavLink
        to="/"
        name="Dashboard"
        :separator="false"
        class="hidden md:inline-block"
        :show-active-state="false"
      />
      <ClientOnly>
        <PortalTarget name="navigation"></PortalTarget>
      </ClientOnly>
    </div>
    <div class="flex items-center gap-2">
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
    <PopupsSignIn v-if="!activeUser" />
  </nav>
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
