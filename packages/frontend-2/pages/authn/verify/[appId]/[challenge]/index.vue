<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="mx-auto">
    <LayoutPanel class="max-w-lg mx-auto w-full">
      <div class="space-y-8 flex flex-col items-center">
        <h1
          class="text-center h3 font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 inline-block text-transparent bg-clip-text"
        >
          Authorize Application
        </h1>
        <template v-if="activeUser && app && !action">
          <div class="space-y-2 flex flex-col">
            <div class="space-x-2 flex items-center">
              <UserAvatar :user="activeUser" size="lg" />
              <div class="label-light">{{ activeUser.name }}</div>
            </div>
            <CommonTextLink
              size="xs"
              :icon-right="ArrowsRightLeftIcon"
              no-underline
              @click="() => logout()"
            >
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
            wants to access your Speckle account.
          </div>
          <div v-if="!app.trustByDefault" class="w-full">
            <Disclosure v-slot="{ open }">
              <DisclosureButton
                class="w-full flex justify-between items-center text-foreground px-2 py-4 border-t border-b border-outline-3"
              >
                <div class="flex space-x-2 items-center">
                  <InformationCircleIcon class="h-5 w-5" />
                  <span class="font-bold">
                    App info & Requested permissions ({{ app.scopes.length }})
                  </span>
                </div>
                <ChevronUpIcon
                  :class="!open ? 'rotate-180 transform' : ''"
                  class="h-5 w-5 text-foreground"
                />
              </DisclosureButton>

              <DisclosurePanel
                class="flex flex-col px-2 py-5 space-y-5 label-light border-b border-outline-3 label-light"
              >
                <table v-if="app.author || app.description?.length" class="table-fixed">
                  <tbody>
                    <tr v-if="app.author">
                      <td class="font-bold pr-2 w-[100px]">Author:</td>
                      <td class="inline-flex space-x-1 items-center">
                        <UserAvatar :user="app.author" size="sm" />
                        <span>{{ app.author.name }}</span>
                      </td>
                    </tr>
                    <tr v-if="app.description?.length">
                      <td class="align-top font-bold pr-2">Description:</td>
                      <td>
                        {{ app.description }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="space-y-4">
                  <div class="font-bold">Permissions:</div>
                  <!-- <ul v-if="false" class="list-disc list-inside space-y-4">
                  <li v-for="scope in app.scopes" :key="scope?.name">
                    <span>{{ scope.description }}</span>
                  </li>
                </ul> -->
                  <ul class="list-disc list-inside">
                    <template
                      v-for="[group, scope] in Object.entries(groupedScopes)"
                      :key="group"
                    >
                      <li>
                        <span class="font-bold">{{ group }}</span>
                        <ul class="ps-5 list-[circle] list-inside">
                          <li v-for="desc in scope" :key="desc">
                            <span>{{ desc }}</span>
                          </li>
                        </ul>
                      </li>
                    </template>
                  </ul>
                </div>
              </DisclosurePanel>
            </Disclosure>
          </div>
          <div class="flex space-x-2 w-full">
            <FormButton color="secondary" full-width size="lg" @click="deny">
              Deny
            </FormButton>
            <FormButton full-width size="lg" @click="allow">Authorize</FormButton>
          </div>
        </template>

        <div v-else-if="app === null" class="flex flex-col space-y-2">
          <span>Could not resolve app.</span>
          <CommonTextLink :to="homeRoute">Go Home</CommonTextLink>
        </div>
        <div v-else-if="action" class="w-full flex flex-col items-center">
          <span class="font-bold">
            <template v-if="action === ChosenAction.Allow">
              Permission granted.
            </template>
            <template v-else>Permission denied.</template>
          </span>
          <span class="label-light text-foreground-2">
            You will be redirected automatically
          </span>
        </div>
      </div>
    </LayoutPanel>
    <div
      v-if="serverInfo?.termsOfService"
      class="mt-3 max-w-lg text-center caption font-medium text-foreground-2 terms-of-service"
      v-html="serverInfo.termsOfService"
    />
  </div>
</template>
<script setup lang="ts">
import { ShieldCheckIcon } from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthCookie, useAuthManager } from '~~/lib/auth/composables/auth'
import { authorizableAppMetadataQuery } from '~~/lib/auth/graphql/queries'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import type { Nullable } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { homeRoute } from '~~/lib/common/helpers/route'
import {
  ArrowsRightLeftIcon,
  InformationCircleIcon,
  ChevronUpIcon
} from '@heroicons/vue/24/outline'
import { useServerInfo } from '~/lib/core/composables/server'
import { upperFirst } from 'lodash-es'
import { toNewProductTerminology } from '~/lib/common/helpers/resources'

/**
// TODO: Process redirect as fetch call so that we can catch errors?
- Not you?> Redirect back after login
 * - Check all if branches
 - Responsivity
 - Layout issues? Check login & register on mobile & desktop? Horizontal scrollbar
 */

enum ChosenAction {
  Allow = 'allow',
  Deny = 'deny'
}

definePageMeta({
  middleware: 'auth',
  name: 'authorize-app'
})

const apiOrigin = useApiOrigin()
const route = useRoute()
const { activeUser } = useActiveUser()
const authToken = useAuthCookie()
const { logout } = useAuthManager()
const mp = useMixpanel()
const { serverInfo } = useServerInfo()

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

const translatedScopes = computed(() => {
  return app.value?.scopes.map((scope) => {
    return {
      description: toNewProductTerminology(scope.description),
      name: toNewProductTerminology(scope.name)
    }
  })
})

const groupedScopes = computed(() => {
  if (!translatedScopes.value) return []

  return translatedScopes.value.reduce((acc, scope) => {
    const key = upperFirst(scope.name.split(':')[0])

    if (!acc[key]) acc[key] = []
    acc[key].push(scope.description)
    return acc
  }, {} as Record<string, string[]>)
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
  // window.location.replace(allowUrl.value) TODO:
}

watch(
  () => !!app.value?.trustByDefault,
  (trustByDefault) => {
    if (trustByDefault) allow()
  },
  { immediate: true }
)
</script>
