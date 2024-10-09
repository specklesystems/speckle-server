<!-- eslint-disable vue/no-v-html -->
<template>
  <div class="mx-auto">
    <LayoutPanel class="max-w-lg mx-auto w-full">
      <div class="space-y-8 flex flex-col items-center">
        <h1
          class="text-center text-heading-xl inline-block text-foreground bg-clip-text"
        >
          Authorize application
        </h1>
        <template v-if="activeUser && app && !action">
          <div class="space-y-2 flex flex-col">
            <div class="space-x-2 flex items-center">
              <UserAvatar :user="activeUser" size="lg" />
              <div class="label-light">{{ activeUser.name }}</div>
            </div>
            <CommonTextLink
              size="sm"
              :icon-right="ArrowsRightLeftIcon"
              @click="onSwitchAccounts"
            >
              Not you? Switch accounts
            </CommonTextLink>
          </div>
          <div class="text-foreground h4 text-center">
            <span class="text-primary font-medium">
              <ShieldCheckIcon
                v-if="trustByDefault"
                class="h-6 w-6 inline-block relative -top-1"
              />
              {{ app?.name }}
            </span>
            wants to access your Speckle account.
          </div>
          <div v-if="!trustByDefault" class="w-full">
            <Disclosure v-slot="{ open }">
              <DisclosureButton
                class="w-full flex justify-between items-center text-foreground px-2 py-4 border-t border-b border-outline-3"
              >
                <div class="flex space-x-2 items-center">
                  <InformationCircleIcon class="h-5 w-5 shrink-0" />
                  <span class="font-medium text-left">
                    App info & requested permissions ({{ app.scopes.length }})
                  </span>
                </div>
                <ChevronUpIcon
                  :class="!open ? 'rotate-180 transform' : ''"
                  class="h-5 w-5 text-foreground shrink-0"
                />
              </DisclosureButton>

              <DisclosurePanel
                class="flex flex-col px-2 py-5 space-y-5 label-light border-b border-outline-3 label-light"
              >
                <table v-if="app.author || app.description?.length" class="table-fixed">
                  <tbody>
                    <tr v-if="app.author">
                      <td class="font-medium pr-2 w-[100px]">Author:</td>
                      <td class="inline-flex space-x-1 items-center">
                        <UserAvatar :user="app.author" size="sm" />
                        <span>{{ app.author.name }}</span>
                      </td>
                    </tr>
                    <tr v-if="app.description?.length">
                      <td class="align-top font-medium pr-2">Description:</td>
                      <td>
                        {{ app.description }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="space-y-4">
                  <div class="font-medium">Permissions:</div>
                  <!-- <ul v-if="false" class="list-disc list-inside space-y-4">
                  <li v-for="scope in app.scopes" :key="scope?.name">
                    <span>{{ scope.description }}</span>
                  </li>
                </ul> -->
                  <ul class="list-inside space-y-2">
                    <template
                      v-for="[group, scope] in Object.entries(groupedScopes)"
                      :key="group"
                    >
                      <li>
                        <span class="font-medium">{{ group }}</span>
                        <ul class="ps-5 list-[circle] list-outside">
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
            <FormButton color="outline" full-width :disabled="loading" @click="deny">
              Deny
            </FormButton>
            <FormButton full-width :disabled="loading" @click="allow">
              Authorize
            </FormButton>
          </div>
        </template>
        <div
          v-else-if="app === null || action"
          class="w-full flex flex-col items-center space-y-4"
        >
          <div class="flex space-x-2 items-center">
            <Component
              :is="
                action === ChosenAction.Allow ? CheckCircleIcon : ExclamationCircleIcon
              "
              class="h-9 w-9"
              :class="[action === ChosenAction.Allow ? 'text-success' : 'text-danger']"
            />
            <span class="text-heading-xl">
              <template v-if="action">
                {{ action === ChosenAction.Allow ? 'Success' : 'Denied' }}
              </template>
              <template v-else>Error</template>
            </span>
          </div>
          <div class="text-center">
            <template v-if="app">
              <template v-if="action === ChosenAction.Allow">
                <span class="font-medium text-primary">{{ app?.name }}</span>
                is connected to your
                <span class="font-medium">Speckle</span>
                account.
              </template>
              <template v-else>
                <span class="font-medium text-primary">{{ app?.name }}</span>
                has not been connected to your
                <span class="font-medium">Speckle</span>
                account.
              </template>
            </template>
            <div v-else class="flex space-x-2 items-center">
              <span>Could not resolve app.</span>
              <CommonTextLink :to="homeRoute">Go home</CommonTextLink>
            </div>
          </div>
          <div v-if="action" class="label-light text-foreground-2">
            You will be redirected automatically, please wait a moment.
          </div>
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
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/solid'
import { useQuery } from '@vue/apollo-composable'
import { useActiveUser } from '~~/lib/auth/composables/activeUser'
import { useAuthCookie, useAuthManager } from '~~/lib/auth/composables/auth'
import { authorizableAppMetadataQuery } from '~~/lib/auth/graphql/queries'
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { ensureError, type Nullable } from '@speckle/shared'
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
import { FetchError } from 'ofetch'
import { usePostAuthRedirect } from '~/lib/auth/composables/postAuthRedirect'

enum ChosenAction {
  Allow = 'allow',
  Deny = 'deny'
}

definePageMeta({
  middleware: 'auth',
  name: 'authorize-app'
})

useHead({
  title: 'Authorize application'
})

const apiOrigin = useApiOrigin()
const route = useRoute()
const { activeUser } = useActiveUser()
const authToken = useAuthCookie()
const { logout } = useAuthManager()
const mp = useMixpanel()
const { serverInfo } = useServerInfo()
const loading = ref(false)
const { triggerNotification } = useGlobalToast()
const postAuthRedirect = usePostAuthRedirect()

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
  finalUrl.searchParams.set('preventRedirect', 'true')

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

const trustByDefault = computed(() => {
  return app.value?.trustByDefault
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

const goToFinalUrl = (url: string) => {
  // waiting 2 seconds before actually redirecting
  setTimeout(() => {
    window.location.replace(url)
  }, 2000)
}

const deny = () => {
  if (import.meta.server || !denyUrl.value || !activeUser.value || loading.value) return

  loading.value = true
  action.value = ChosenAction.Deny
  mp.track('App Authorization', { allow: false, type: 'action' })
  goToFinalUrl(denyUrl.value)
}

const allow = async () => {
  if (import.meta.server || !allowUrl.value || loading.value) return

  loading.value = true
  mp.track('App Authorization', { allow: true, type: 'action' })

  try {
    const allowRes = await $fetch<{ redirectUrl: string }>(allowUrl.value)
    if (!allowRes?.redirectUrl) {
      throw new Error('Malformed authorization response, please contact site admins.')
    }

    // Finally redirect
    action.value = ChosenAction.Allow
    goToFinalUrl(allowRes.redirectUrl)
  } catch (err) {
    triggerNotification({
      type: ToastNotificationType.Danger,
      title: 'App authorization failed',
      description:
        err instanceof FetchError
          ? (err.data as string) || err.statusMessage || err.message
          : ensureError(err).message,
      autoClose: false
    })
  } finally {
    loading.value = false
  }
}

const onSwitchAccounts = async () => {
  const path = route.fullPath
  await logout()
  postAuthRedirect.set(path, true)
}

if (import.meta.client) {
  watch(
    () => trustByDefault.value,
    (newVal) => {
      if (newVal) void allow()
    },
    { immediate: true }
  )
}
</script>
