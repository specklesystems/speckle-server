<template>
  <section>
    <div class="md:max-w-5xl md:mx-auto pb-6 md:pb-0">
      <div class="flex flex-col">
        <SettingsSectionHeader
          title="Developer settings"
          text="Manage your tokens and authorized app"
        />
        <div class="flex flex-col gap-6 md:gap-12">
          <div class="flex flex-col">
            <SettingsSectionHeader
              title="Explore GraphQL"
              class="md:gap-0"
              subheading
              :buttons="[
                {
                  props: {
                    color: 'outline',
                    target: '_blank',
                    external: true,
                    iconLeft: BookOpenIcon
                  },
                  onClick: goToExplorer,
                  label: 'Open docs'
                }
              ]"
            />
          </div>
          <hr class="border-outline-3" />
          <div class="flex flex-col gap-4">
            <SettingsSectionHeader
              title="Access tokens"
              subheading
              :buttons="[
                {
                  props: {
                    color: 'outline',
                    to: 'https://speckle.guide/dev/tokens.html',
                    iconLeft: BookOpenIcon,
                    target: '_blank',
                    external: true
                  },
                  label: 'Open docs'
                },
                {
                  props: {
                    iconLeft: PlusIcon,
                    onClick: openCreateTokenDialog
                  },
                  label: 'New token'
                }
              ]"
            >
              <p class="text-body-xs pt-6 md:pt-4 text-foreground">
                Personal Access Tokens can be used to access the Speckle API on this
                server; they function like ordinary OAuth access tokens. Use them in
                your scripts or apps!
                <br />
                <span class="font-medium">
                  Treat them like a password: do not post them anywhere where they could
                  be accessed by others (e.g., public repos).
                </span>
              </p>
            </SettingsSectionHeader>
            <LayoutTable
              :columns="[
                { id: 'name', header: 'Name', classes: 'col-span-3 truncate' },
                { id: 'id', header: 'ID', classes: 'col-span-2' },
                {
                  id: 'scope',
                  header: 'Scope',
                  classes: 'col-span-7 whitespace-break-spaces text-xs'
                }
              ]"
              :items="tokens"
              :buttons="[
                {
                  icon: TrashIcon,
                  label: 'Delete',
                  action: openDeleteDialog,
                  class: 'text-danger'
                }
              ]"
            >
              <template #name="{ item }">
                {{ item.name }}
              </template>
              <template #id="{ item }">
                <span class="rounded text-xs font-mono bg-foundation-page p-2">
                  {{ item.id }}
                </span>
              </template>

              <template #scope="{ item }">
                {{ getItemScopes(item) }}
              </template>
            </LayoutTable>
          </div>
          <hr class="border-outline-3" />
          <div class="flex flex-col gap-4">
            <SettingsSectionHeader
              subheading
              title="Applications"
              :buttons="[
                {
                  props: {
                    color: 'outline',
                    to: 'https://speckle.guide/dev/apps.html',
                    target: '_blank',
                    external: true,
                    iconLeft: BookOpenIcon
                  },
                  label: 'Open docs'
                },
                {
                  props: {
                    onClick: openCreateApplicationDialog,
                    iconLeft: PlusIcon
                  },
                  label: 'New application'
                }
              ]"
            >
              <p class="text-body-xs pt-6 md:pt-4 text-foreground">
                Register and manage third-party Speckle Apps that, once authorised by a
                user on this server, can act on their behalf.
              </p>
            </SettingsSectionHeader>
            <LayoutTable
              :columns="[
                { id: 'name', header: 'Name', classes: 'col-span-3' },
                { id: 'id', header: 'ID', classes: 'col-span-2' },
                {
                  id: 'scope',
                  header: 'Scope',
                  classes: 'col-span-7 whitespace-break-spaces text-xs'
                }
              ]"
              :items="applications"
              :buttons="[
                {
                  icon: LockOpenIcon,
                  label: 'Reveal Secret',
                  action: openRevealSecretDialog,
                  class: 'text-primary'
                },
                {
                  icon: PencilIcon,
                  label: 'Edit',
                  action: openEditApplicationDialog,
                  class: 'text-primary'
                },
                {
                  icon: TrashIcon,
                  label: 'Delete',
                  action: openDeleteDialog,
                  class: 'text-danger'
                }
              ]"
            >
              <template #name="{ item }">
                {{ item.name }}
              </template>
              <template #id="{ item }">
                <span class="rounded text-xs font-mono bg-foundation-page p-2">
                  {{ item.id }}
                </span>
              </template>

              <template #scope="{ item }">
                {{ getItemScopes(item) }}
              </template>
            </LayoutTable>
          </div>
          <hr class="border-outline-3" />
          <div class="flex flex-col gap-4">
            <SettingsSectionHeader
              subheading
              title="Authorized Apps"
              :buttons="[
                {
                  props: {
                    color: 'outline',
                    to: 'https://speckle.guide/dev/apps.html',
                    target: '_blank',
                    external: true,
                    iconLeft: BookOpenIcon
                  },
                  label: 'Open docs'
                }
              ]"
            >
              <p class="text-sm pt-6 md:pt-4">
                Here you can review the apps that you have granted access to. If
                something looks suspicious, revoke the access.
              </p>
            </SettingsSectionHeader>
            <LayoutTable
              :columns="[
                { id: 'name', header: 'Name', classes: 'col-span-3 ' },
                { id: 'author', header: 'Author', classes: 'col-span-3 ' },
                {
                  id: 'description',
                  header: 'Description',
                  classes: 'col-span-6 !pt-1.5'
                }
              ]"
              :items="authorizedApps"
              :buttons="[
                {
                  icon: XMarkIcon,
                  label: 'Revoke Access',
                  action: openDeleteDialog,
                  class: 'text-danger'
                }
              ]"
              row-items-align="stretch"
            >
              <template #name="{ item }">
                {{ item.name }}
              </template>
              <template #author="{ item }">
                <div class="flex space-x-2 items-center">
                  <template v-if="item.author">
                    <UserAvatar :user="item.author" />
                    <span>{{ item.author.name }}</span>
                  </template>
                  <template v-else>
                    <HeaderLogoBlock minimal no-link />
                    <span>Speckle</span>
                  </template>
                </div>
              </template>
              <template #description="{ item }">
                {{ item.description }}
              </template>
            </LayoutTable>
          </div>
        </div>

        <SettingsUserDeveloperCreateTokenDialog
          v-model:open="showCreateTokenDialog"
          @token-created="(token) => handleTokenCreated(token)"
        />
        <SettingsUserDeveloperDeleteDialog
          v-model:open="showDeleteDialog"
          :item="itemToModify"
        />
        <SettingsUserDeveloperCreateEditApplicationDialog
          v-model:open="showCreateEditApplicationDialog"
          :application="(itemToModify as ApplicationItem)"
          @application-created="handleApplicationCreated"
        />
        <SettingsUserDeveloperRevealSecretDialog
          v-model:open="showRevealSecretDialog"
          :application="itemToModify && 'secret' in itemToModify ? itemToModify : null"
        />
        <SettingsUserDeveloperCreateTokenSuccessDialog
          v-model:open="showCreateTokenSuccessDialog"
          :token="tokenSuccess"
        />
        <SettingsUserDeveloperCreateApplicationSuccessDialog
          v-model:open="showCreateApplicationSuccessDialog"
          :application="(itemToModify as ApplicationItem)"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  PlusIcon,
  BookOpenIcon,
  TrashIcon,
  PencilIcon,
  LockOpenIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import type {
  TokenItem,
  ApplicationItem,
  AuthorizedAppItem
} from '~~/lib/developer-settings/helpers/types'
import {
  developerSettingsAccessTokensQuery,
  developerSettingsApplicationsQuery,
  developerSettingsAuthorizedAppsQuery
} from '~~/lib/developer-settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

useHead({
  title: 'Developer Settings'
})

const apiOrigin = useApiOrigin()

const { result: tokensResult, refetch: refetchTokens } = useQuery(
  developerSettingsAccessTokensQuery
)
const { result: applicationsResult, refetch: refetchApplications } = useQuery(
  developerSettingsApplicationsQuery
)
const { result: authorizedAppsResult } = useQuery(developerSettingsAuthorizedAppsQuery)

const itemToModify = ref<TokenItem | ApplicationItem | AuthorizedAppItem | null>(null)
const tokenSuccess = ref('')
const showCreateTokenDialog = ref(false)
const showCreateTokenSuccessDialog = ref(false)
const showCreateApplicationSuccessDialog = ref(false)
const showDeleteDialog = ref(false)
const showCreateEditApplicationDialog = ref(false)
const showRevealSecretDialog = ref(false)

const tokens = computed<TokenItem[]>(() => {
  return (
    tokensResult.value?.activeUser?.apiTokens?.filter(
      (token): token is TokenItem => token !== null
    ) || []
  )
})

const applications = computed<ApplicationItem[]>(() => {
  return applicationsResult.value?.activeUser?.createdApps || []
})

const authorizedApps = computed(() =>
  (authorizedAppsResult.value?.activeUser?.authorizedApps || []).filter(
    (app) => app.id !== 'spklwebapp'
  )
)

const openDeleteDialog = (item: TokenItem | ApplicationItem | AuthorizedAppItem) => {
  itemToModify.value = item
  showDeleteDialog.value = true
}

const openCreateApplicationDialog = () => {
  itemToModify.value = null
  showCreateEditApplicationDialog.value = true
}

const openCreateTokenDialog = () => {
  showCreateTokenDialog.value = true
}

const openEditApplicationDialog = (item: ApplicationItem) => {
  itemToModify.value = item
  showCreateEditApplicationDialog.value = true
}

const openRevealSecretDialog = (item: ApplicationItem) => {
  itemToModify.value = item
  showRevealSecretDialog.value = true
}

const handleTokenCreated = (token: string) => {
  refetchTokens()
  tokenSuccess.value = token
  showCreateTokenSuccessDialog.value = true
}

const handleApplicationCreated = (applicationId: string) => {
  refetchApplications()?.then(() => {
    const newApplication = applications.value.find((app) => app.id === applicationId)

    if (newApplication) {
      itemToModify.value = newApplication
      showCreateApplicationSuccessDialog.value = true
    }
  })
}

const goToExplorer = () => {
  if (!import.meta.client) return
  window.location.href = new URL('/explorer', apiOrigin).toString()
}

const getItemScopes = (item: TokenItem | ApplicationItem): string => {
  return item.scopes
    ? item.scopes
        .map(
          (event, index, array) => `"${event}"${index < array.length - 1 ? ',' : ''}`
        )
        .join(' ')
    : 'No scopes available'
}
</script>
