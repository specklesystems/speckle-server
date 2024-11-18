<template>
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
        Personal Access Tokens can be used to access the Speckle API on this server;
        they function like ordinary OAuth access tokens. Use them in your scripts or
        apps!
        <br />
        <span class="font-medium">
          Treat them like a password: do not post them anywhere where they could be
          accessed by others (e.g., public repos).
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
          classes: 'col-span-6 whitespace-break-spaces text-xs'
        },
        { id: 'actions', header: '', classes: 'col-span-1 flex justify-end' }
      ]"
      :items="tokens"
      :loading="loading"
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

      <template #actions="{ item }">
        <LayoutMenu
          v-model:open="showActionsMenu[item.id]"
          :items="actionItems"
          mount-menu-on-body
          :menu-position="HorizontalDirection.Left"
          @chosen="({ item: actionItem }) => onActionChosen(actionItem, item)"
        >
          <FormButton
            :color="showActionsMenu[item.id] ? 'outline' : 'subtle'"
            hide-text
            :icon-right="showActionsMenu[item.id] ? XMarkIcon : EllipsisHorizontalIcon"
            @click.stop="toggleMenu(item.id)"
          />
        </LayoutMenu>
      </template>
    </LayoutTable>

    <SettingsUserDeveloperAccessTokensCreateDialog
      v-model:open="showCreateTokenDialog"
      @token-created="handleTokenCreated"
    />
    <SettingsUserDeveloperAccessTokensSuccessDialog
      v-model:open="showCreateTokenSuccessDialog"
      :token="tokenSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import {
  PlusIcon,
  BookOpenIcon,
  EllipsisHorizontalIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'
import { developerSettingsAccessTokensQuery } from '~~/lib/developer-settings/graphql/queries'
import type { TokenItem } from '~~/lib/developer-settings/helpers/types'
import { HorizontalDirection } from '~~/lib/common/composables/window'
import type { LayoutMenuItem } from '~~/lib/layout/helpers/components'

const emit = defineEmits<{
  (e: 'delete', item: TokenItem): void
}>()

const {
  result: tokensResult,
  refetch: refetchTokens,
  loading
} = useQuery(developerSettingsAccessTokensQuery)

const tokenSuccess = ref('')
const showCreateTokenDialog = ref(false)
const showCreateTokenSuccessDialog = ref(false)
const showActionsMenu = ref<Record<string, boolean>>({})

const tokens = computed<TokenItem[]>(() => {
  return (
    tokensResult.value?.activeUser?.apiTokens?.filter(
      (token): token is TokenItem => token !== null
    ) || []
  )
})

enum ActionTypes {
  RemoveToken = 'remove-token'
}

const actionItems: LayoutMenuItem[][] = [
  [
    {
      title: 'Remove token...',
      id: ActionTypes.RemoveToken
    }
  ]
]

const onActionChosen = (actionItem: LayoutMenuItem, token: TokenItem) => {
  if (actionItem.id === ActionTypes.RemoveToken) {
    emit('delete', token)
  }
}

const toggleMenu = (itemId: string) => {
  showActionsMenu.value[itemId] = !showActionsMenu.value[itemId]
}

const openCreateTokenDialog = () => {
  showCreateTokenDialog.value = true
}

const handleTokenCreated = (token: string) => {
  refetchTokens()
  tokenSuccess.value = token
  showCreateTokenSuccessDialog.value = true
}

const getItemScopes = (item: TokenItem): string => {
  if (!item.scopes || item.scopes.length === 0) return 'No scopes available'

  return item.scopes
    ? item.scopes
        .map(
          (event, index, array) => `"${event}"${index < array.length - 1 ? ',' : ''}`
        )
        .join(' ')
    : 'No scopes available'
}
</script>
