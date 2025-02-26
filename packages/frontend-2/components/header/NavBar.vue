<template>
  <div>
    <nav class="fixed z-40 top-0 h-12 bg-foundation border-b border-outline-2">
      <div
        class="flex gap-4 items-center justify-between h-full w-screen py-4 px-3 sm:px-4"
      >
        <!-- <HeaderLogoBlock :active="false" to="/" class="hidden lg:flex lg:min-w-40" /> -->
        <HeaderWorkspaceSwitcher />
        <div class="flex items-center truncate">
          <ClientOnly>
            <PortalTarget name="mobile-navigation"></PortalTarget>
          </ClientOnly>
          <ClientOnly>
            <PortalTarget name="navigation"></PortalTarget>
          </ClientOnly>
        </div>
        <div class="flex items-center justify-end gap-2.5 sm:gap-2 lg:min-w-40">
          <ClientOnly>
            <PortalTarget name="secondary-actions"></PortalTarget>
            <PortalTarget name="primary-actions"></PortalTarget>
          </ClientOnly>
          <FormButton
            v-if="!activeUser"
            :to="loginUrl.fullPath"
            color="outline"
            class="hidden md:flex"
          >
            Sign in
          </FormButton>
          <!-- Profile dropdown -->
          <HeaderNavUserMenu :login-url="loginUrl" />
        </div>
      </div>
    </nav>
    <PopupsSignIn v-if="!activeUser" />
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
