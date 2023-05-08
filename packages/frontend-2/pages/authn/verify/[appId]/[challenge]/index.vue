<template>
  <div class="flex flex-col items-center">
    <LogoTextWhite class="my-6 sm:mb-14" />
    <LayoutPanel class="max-w-screen-sm mx-auto w-full">
      <div
        v-if="activeUser && app && !action"
        class="space-y-8 flex flex-col items-center"
      >
        <div class="space-y-2 flex flex-col items-center">
          <UserAvatar :user="activeUser" size="lg" />
          <div class="text-foreground h6">{{ activeUser.name }}</div>
          <CommonTextLink size="xs" @click="() => logout()">
            Not you? Switch accounts
          </CommonTextLink>
        </div>
        <div class="text-foreground h4 text-center">
          <span class="text-primary font-bold">
            <ShieldCheckIcon
              v-if="app?.trustByDefault"
              class="h-6 w-6 inline-block relative -top-1"
            />
            {{ app?.name }}
          </span>
          is requesting access to your Speckle account
        </div>
        <div v-if="!app.trustByDefault" class="w-full">
          <Disclosure v-slot="{ open }">
            <DisclosureButton
              class="w-full flex justify-between items-center text-foreground px-4 py-2 rounded-lg hover:bg-foundation-focus"
            >
              <span class="font-bold">
                App info & requested permissions ({{ app.scopes.length }})
              </span>
              <ChevronUpIcon
                :class="!open ? 'rotate-180 transform' : ''"
                class="h-5 w-5 text-primary"
              />
            </DisclosureButton>
            <DisclosurePanel
              class="flex flex-col px-4 py-2 space-y-2 label label--light"
            >
              <div v-if="app.author" class="space-x-1 inline-flex items-center">
                <span class="font-bold">Author:</span>
                <span>{{ app.author.name }}</span>
                <UserAvatar :user="app.author" size="sm" />
              </div>
              <div v-if="app.description?.length" class="space-x-1">
                <span class="font-bold">Description:</span>
                <span>{{ app.description }}</span>
              </div>
              <div>
                <div class="bg-foundation-disabled h-[1px] my-2" />
              </div>
              <div class="font-bold">Permissions:</div>
              <div v-for="scope in app.scopes" :key="scope?.name" class="space-x-1">
                <span class="font-bold">{{ scope.name }}</span>
                <span>{{ scope.description }}</span>
              </div>
            </DisclosurePanel>
          </Disclosure>
        </div>
        <div class="flex space-x-2 w-full">
          <FormButton color="danger" full-width size="lg" @click="deny">
            Deny
          </FormButton>
          <FormButton full-width size="lg" @click="allow">Allow</FormButton>
        </div>
        <div class="w-full text-foreground-2 text-center label-light">
          Clicking 'Allow' will redirect you to {{ app.redirectUrl }}
        </div>
      </div>
      <div v-else-if="action" class="w-full flex flex-col items-center">
        <span class="font-bold">
          <template v-if="action === ChosenAction.Allow">Permission granted.</template>
          <template v-else>Permission denied.</template>
        </span>
        <span class="label-light text-foreground-2">
          You will be redirected automatically
        </span>
      </div>
      <div v-else-if="app === null" class="space-x-2">
        <span>Could not resolve app.</span>
        <CommonTextLink :to="homeRoute">Go Home</CommonTextLink>
      </div>
    </LayoutPanel>
  </div>
</template>
<script setup lang="ts">
import { ShieldCheckIcon } from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthCookie, useAuthManager } from '~~/lib/auth/composables/auth'
import { authorizableAppMetadataQuery } from '~~/lib/auth/graphql/queries'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ChevronUpIcon } from '@heroicons/vue/20/solid'
import { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { homeRoute } from '~~/lib/common/helpers/route'

enum ChosenAction {
  Allow = 'allow',
  Deny = 'deny'
}

definePageMeta({
  middleware: 'auth',
  name: 'authorize-app'
})

const {
  public: { apiOrigin }
} = useRuntimeConfig()
const route = useRoute()
const { activeUser } = useActiveUser()
const authToken = useAuthCookie()
const { logout } = useAuthManager()
const mp = useMixpanel()

const appId = computed(() => route.params.appId as string)
const challenge = computed(() => route.params.challenge as string)

const { result: appMetadata } = useQuery(authorizableAppMetadataQuery, () => ({
  id: appId.value
}))

const action = ref(null as Nullable<ChosenAction>)

const app = computed(() => appMetadata.value?.app)
const denyUrl = computed(() => {
  if (!app.value) return null

  const finalUrl = new URL(app.value.redirectUrl)
  finalUrl.searchParams.set('denied', 'true')
  return finalUrl.toString()
})
const allowUrl = computed(() => {
  if (!app.value || !authToken.value) return null

  const finalUrl = new URL('/auth/accesscode', apiOrigin)
  finalUrl.searchParams.set('appId', app.value.id)
  finalUrl.searchParams.set('challenge', challenge.value)
  finalUrl.searchParams.set('token', authToken.value)

  return finalUrl.toString()
})

const deny = () => {
  if (process.server || !denyUrl.value || !activeUser.value) return

  action.value = ChosenAction.Deny
  mp.track('App Authorization', { allow: false, type: 'action' })
  window.location.replace(denyUrl.value)
}

const allow = () => {
  if (process.server || !allowUrl.value) return

  action.value = ChosenAction.Allow
  mp.track('App Authorization', { allow: true, type: 'action' })
  window.location.replace(allowUrl.value)
}

watch(
  () => !!app.value?.trustByDefault,
  (trustByDefault) => {
    if (trustByDefault) allow()
  },
  { immediate: true }
)
</script>
