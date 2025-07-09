<template>
  <ProjectPageSettingsBlock :auth-check="canUpdate" title="Tokens">
    <template #introduction>
      <p class="text-body-xs text-foreground">
        These tokens are used to embed non-public Speckle projects.
      </p>
    </template>

    <h3 class="text-heading-sm mt-6 mb-4">Embed tokens</h3>
    <LayoutTable
      :columns="[
        { id: 'createdAt', header: 'Created at', classes: 'col-span-4' },
        { id: 'lastUsed', header: 'Last used', classes: 'col-span-4' },
        { id: 'createdBy', header: 'Created by', classes: 'col-span-4' }
      ]"
      :items="embedTokens"
      :buttons="
        canRevoke?.authorized
          ? [
              {
                icon: TrashIcon,
                label: 'Delete',
                disabled: !canUpdate?.authorized,
                action: openDeleteWebhookDialog
              }
            ]
          : undefined
      "
    >
      <template #createdAt="{ item }">
        {{ formattedFullDate(item.createdAt) }}
      </template>
      <template #lastUsed="{ item }">
        {{ formattedFullDate(item.lastUsed) }}
      </template>
      <template #createdBy="{ item }">
        <span class="flex items-center gap-2">
          <UserAvatar :user="item.user" size="sm" />
          {{ item.user?.name }}
        </span>
      </template>
    </LayoutTable>

    <InfiniteLoading
      v-if="embedTokens?.length"
      :settings="{ identifier }"
      class="py-4"
      @infinite="onInfiniteLoad"
    />

    <ProjectPageSettingsTokensDeleteDialog
      v-model:open="showDeleteTokenDialog"
      :token="tokenToDelete"
      @confirm="onDeleteToken"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { TrashIcon } from '@heroicons/vue/24/outline'
import { projectEmbedTokensQuery } from '~~/lib/projects/graphql/queries'
import type { EmbedTokenItem } from '~~/lib/projects/helpers/types'
import { graphql } from '~/lib/common/generated/gql'
import { formattedFullDate } from '~/utils/dateFormatter'
import { useDeleteEmbedToken } from '~~/lib/projects/composables/tokenManagement'
import { usePaginatedQuery } from '~/lib/common/composables/graphql'
import type { Nullable } from '@speckle/shared'

graphql(`
  fragment ProjectPageSettingsTokens_Project on Project {
    id
    permissions {
      canReadEmbedTokens {
        ...FullPermissionCheckResult
      }
      canRevokeEmbedTokens {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const route = useRoute()
const projectId = computed(() => route.params.id as string)
const deleteEmbedToken = useDeleteEmbedToken()
const {
  identifier,
  onInfiniteLoad,
  query: { result: result }
} = usePaginatedQuery({
  query: projectEmbedTokensQuery,
  baseVariables: computed(() => ({
    limit: 20,
    projectId: projectId.value,
    cursor: null as Nullable<string>
  })),
  resolveKey: (vars) => [vars.projectId],
  resolveCurrentResult: (res) => res?.project?.embedTokens,
  resolveNextPageVariables: (baseVars, cursor) => ({
    ...baseVars,
    cursor
  }),
  resolveCursorFromVariables: (vars) => vars.cursor
})

const tokenToDelete = ref<EmbedTokenItem | null>(null)
const showDeleteTokenDialog = ref(false)

const canUpdate = computed(() => result.value?.project?.permissions?.canReadEmbedTokens)
const canRevoke = computed(
  () => result.value?.project?.permissions?.canRevokeEmbedTokens
)
const embedTokens = computed(() => {
  return (result.value?.project?.embedTokens?.items || []).map((token) => ({
    ...token,
    id: token.tokenId
  }))
})

const openDeleteWebhookDialog = (item: EmbedTokenItem) => {
  tokenToDelete.value = item
  showDeleteTokenDialog.value = true
}

const onDeleteToken = () => {
  if (!tokenToDelete.value?.tokenId) return

  deleteEmbedToken({
    projectId: projectId.value,
    token: tokenToDelete.value?.tokenId
  })

  tokenToDelete.value = null
}
</script>
