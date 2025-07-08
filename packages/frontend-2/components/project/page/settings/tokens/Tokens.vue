<template>
  <ProjectPageSettingsBlock :auth-check="canUpdate" title="Tokens">
    <template #introduction>
      <p class="text-body-xs text-foreground">
        These tokens are used to embed private Speckle projects.
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
      :buttons="[
        {
          icon: TrashIcon,
          label: 'Delete',
          disabled: !canUpdate?.authorized,
          action: openDeleteWebhookDialog
        }
      ]"
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

    <ProjectPageSettingsTokensDeleteDialog
      v-model:open="showDeleteTokenDialog"
      :token="tokenToDelete"
      @confirm="onDeleteToken"
    />
  </ProjectPageSettingsBlock>
</template>

<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { projectEmbedTokensQuery } from '~~/lib/projects/graphql/queries'
import type { EmbedTokenItem } from '~~/lib/projects/helpers/types'
import { graphql } from '~/lib/common/generated/gql'
import { formattedFullDate } from '~/utils/dateFormatter'
import { useDeleteEmbedToken } from '~~/lib/projects/composables/tokenManagement'

graphql(`
  fragment ProjectPageSettingsTokens_Project on Project {
    id
    permissions {
      canUpdate {
        ...FullPermissionCheckResult
      }
    }
  }
`)

const projectId = computed(() => route.params.id as string)
const route = useRoute()

const { result: pageResult } = useQuery(projectEmbedTokensQuery, () => ({
  projectId: projectId.value
}))

const canUpdate = computed(() => pageResult.value?.project?.permissions?.canUpdate)
const tokenToDelete = ref<EmbedTokenItem | null>(null)
const showDeleteTokenDialog = ref(false)
const deleteEmbedToken = useDeleteEmbedToken()

const embedTokens = computed<EmbedTokenItem[]>(() => {
  return pageResult.value?.project?.embedTokens || []
})

const openDeleteWebhookDialog = (item: EmbedTokenItem) => {
  tokenToDelete.value = item
  showDeleteTokenDialog.value = true
}

const onDeleteToken = () => {
  deleteEmbedToken({
    projectId: projectId.value,
    token: tokenToDelete.value?.tokenId
  })

  tokenToDelete.value = null
}
</script>
