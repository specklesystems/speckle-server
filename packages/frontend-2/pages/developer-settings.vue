<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        to="/developer-settings/"
        name="Developer Settings"
      ></HeaderNavLink>
    </Portal>
    <div class="flex flex-col gap-16">
      <DeveloperSettingsSectionHeader
        title="Developer Settings"
        :buttons="[
          {
            props: {
              color: 'primary',
              to: apiOrigin + '/explorer',
              target: '_blank',
              external: true
            },
            label: 'Explore GraphQL'
          }
        ]"
      >
        Heads up! The sections below are intended for developers.
      </DeveloperSettingsSectionHeader>
      <div class="flex flex-col gap-4">
        <DeveloperSettingsSectionHeader
          title="Access Tokens"
          subheading
          :buttons="[
            {
              props: {
                color: 'invert',
                to: 'https://speckle.guide/dev/tokens.html',
                iconLeft: BookOpenIcon,
                target: '_blank',
                external: true
              },
              label: 'Open Docs'
            },
            {
              props: {
                color: 'primary',
                iconLeft: PlusIcon,
                onClick: openCreateTokenDialog
              },
              label: 'New Token'
            }
          ]"
        >
          Personal Access Tokens can be used to access the Speckle API on this server;
          they function like ordinary OAuth access tokens. Use them in your scripts or
          apps!
          <strong>
            Treat them like a password: do not post them anywhere where they could be
            accessed by others (e.g., public repos).
          </strong>
        </DeveloperSettingsSectionHeader>

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
              textColor: 'danger'
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
            <div>
              {{
                item.scopes
                  ? item.scopes
                      .map(
                        (event, index, array) =>
                          `"${event}"${index < array.length - 1 ? ',' : ''}`
                      )
                      .join(' ')
                  : 'No scopes available'
              }}
            </div>
          </template>
        </LayoutTable>
      </div>

      <div class="flex flex-col gap-4">
        <DeveloperSettingsSectionHeader
          subheading
          title="Applications"
          :buttons="[
            {
              props: {
                color: 'invert',
                to: 'https://speckle.guide/dev/apps.html',
                target: '_blank',
                external: true,
                iconLeft: BookOpenIcon
              },
              label: 'Open Docs'
            },
            {
              props: {
                color: 'primary',
                onClick: openCreateApplicationDialog,
                iconLeft: PlusIcon
              },
              label: 'New Application'
            }
          ]"
        >
          Register and manage third-party Speckle Apps that, once authorised by a user
          on this server, can act on their behalf.
        </DeveloperSettingsSectionHeader>
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
              textColor: 'primary'
            },
            {
              icon: PencilIcon,
              label: 'Edit',
              action: openEditApplicationDialog,
              textColor: 'primary'
            },
            {
              icon: TrashIcon,
              label: 'Delete',
              action: openDeleteDialog,
              textColor: 'danger'
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
            <div>
              {{
                item.scopes
                  .map(
                    (event, index, array) =>
                      `"${event.name}"${index < array.length - 1 ? ',' : ''}`
                  )
                  .join(' ')
              }}
            </div>
          </template>
        </LayoutTable>
      </div>

      <div class="flex flex-col gap-4">
        <DeveloperSettingsSectionHeader
          subheading
          title="Authorized Apps"
          :buttons="[
            {
              props: {
                color: 'invert',
                to: 'https://speckle.guide/dev/apps.html',
                target: '_blank',
                external: true,
                iconLeft: BookOpenIcon
              },
              label: 'Open Docs'
            }
          ]"
        >
          Here you can review the apps that you have granted access to. If something
          looks suspicious, revoke the access.
        </DeveloperSettingsSectionHeader>
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
              icon: XMarkIcon,
              label: 'Revoke Access',
              action: openDeleteDialog,
              textColor: 'danger'
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
            <div>
              {{
                item.scopes
                  .map(
                    (event, index, array) =>
                      `"${event.name}"${index < array.length - 1 ? ',' : ''}`
                  )
                  .join(' ')
              }}
            </div>
          </template>
        </LayoutTable>
      </div>
    </div>

    <DeveloperSettingsCreateTokenDialog
      v-model:open="showCreateTokenDialog"
      @token-created="(token) => handleTokenCreated(token)"
    />
    <DeveloperSettingsDeleteDialog
      v-model:open="showDeleteDialog"
      :item="itemToModify"
    />
    <DeveloperSettingsCreateEditApplicationDialog
      v-model:open="showCreateEditApplicationDialog"
      :application="(itemToModify as ApplicationItem)"
      @application-created="handleApplicationCreated"
    />
    <DeveloperSettingsRevealSecretDialog
      v-model:open="showRevealSecretDialog"
      :application="itemToModify && 'secret' in itemToModify ? itemToModify : null"
    />
    <DeveloperSettingsCreateTokenSuccessDialog
      v-model:open="showCreateTokenSuccessDialog"
      :token="tokenSuccess"
    />
    <DeveloperSettingsCreateApplicationSuccessDialog
      v-model:open="showCreateApplicationSuccessDialog"
      :application="(itemToModify as ApplicationItem)"
    />
  </div>
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
  ApplicationItem
} from '~~/lib/developer-settings/helpers/types'
import {
  developerSettingsAccessTokensQuery,
  developerSettingsApplicationsQuery
} from '~~/lib/developer-settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

// TODO: Hide first party apps like in FE1

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

const itemToModify = ref<TokenItem | ApplicationItem | null>(null)
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

const openDeleteDialog = (item: TokenItem | ApplicationItem) => {
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
</script>
