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
              to: apiOrigin + '/graphql',
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
                onclick: openCreateTokenDialog
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
              action: openDeleteTokenDialog,
              class: 'text-red-500'
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
              icon: TrashIcon,
              label: 'Delete',
              action: openCreateApplicationDialog,
              class: 'text-red-500'
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
  </div>

  <DeveloperSettingsCreateTokenDialog
    v-model:open="showCreateTokenDialog"
    @token-created="handleTokenCreated"
  />
  <DeveloperSettingsDeleteTokenDialog
    v-model:open="showDeleteTokenDialog"
    :token="tokenToModify"
  />
  <DeveloperSettingsCreateApplicationDialog
    v-model:open="showCreateApplicationDialog"
    @token-created="handleApplicationCreated"
  />
</template>

<script setup lang="ts">
import { PlusIcon, BookOpenIcon, TrashIcon } from '@heroicons/vue/24/outline'
import { TokenItem, ApplicationItem } from '~~/lib/developer-settings/helpers/types'
import {
  developerSettingsAccessTokensQuery,
  developerSettingsApplicationsQuery
} from '~~/lib/developer-settings/graphql/queries'
import { useQuery } from '@vue/apollo-composable'

const {
  public: { apiOrigin }
} = useRuntimeConfig()

const { result: tokensResult, refetch: refetchTokens } = useQuery(
  developerSettingsAccessTokensQuery
)

const { result: applicationsResult, refetch: refetchApplications } = useQuery(
  developerSettingsApplicationsQuery
)

const tokenToModify = ref<TokenItem | null>(null)
const showCreateTokenDialog = ref(false)
const showDeleteTokenDialog = ref(false)
const showCreateApplicationDialog = ref(false)

const tokens = computed<TokenItem[]>(() => {
  return tokensResult.value?.activeUser?.apiTokens || []
})

const applications = computed<ApplicationItem[]>(() => {
  return applicationsResult.value?.activeUser?.createdApps || []
})

const openDeleteTokenDialog = (item: TokenItem) => {
  tokenToModify.value = item
  showDeleteTokenDialog.value = true
}

const openCreateApplicationDialog = () => {
  showCreateApplicationDialog.value = true
}

const handleTokenCreated = () => {
  refetchTokens()
}

const handleApplicationCreated = () => {
  refetchApplications()
}

const openCreateTokenDialog = () => {
  showCreateTokenDialog.value = true
}
</script>
