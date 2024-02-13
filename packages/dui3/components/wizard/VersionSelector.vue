<template>
  <div>
    <div class="space-y-4">
      <div class="mb-2">
        <div class="h5 font-bold">Select a version</div>
      </div>
      <div class="grid grid-cols-2 gap-3 max-[475px]:grid-cols-1 mb-4">
        <div class="col-span-2 max-[475px]:col-span-1">
          <FormButton
            v-if="versions && versions.length !== 0"
            full-width
            size="xl"
            :disabled="!versions || versions.length === 0"
            @click="$emit('next', versions[0])"
          >
            Load latest
          </FormButton>
        </div>
        <button
          v-for="version in versions"
          :key="version.id"
          class="block text-left shadow rounded-md bg-foundation-2 hover:bg-primary-muted transition"
          @click="$emit('next', version)"
        >
          <div class="mb-2">
            <img :src="version.previewUrl" alt="version preview" />
          </div>
          <div class="mt-1 p-2 border-t dark:border-gray-700">
            <div class="flex space-x-2 items-center min-w-0">
              <UserAvatar :user="version.authorUser" size="sm" />
              <SourceAppBadge
                :source-app="
                SourceApps.find((sapp) =>
                  version.sourceApplication?.toLowerCase()?.includes(sapp.searchKey.toLowerCase())
                ) || {
                  searchKey: '',
                  name: version.sourceApplication as SourceAppName,
                  short: version.sourceApplication?.substring(0, 3) as string,
                  bgColor: '#000'
                }
              "
              />
              <span class="text-xs truncate">
                {{ new Date(version.createdAt).toLocaleString() }}
              </span>
            </div>
            <div class="text-xs text-foreground-2 mt-1 line-clamp-1 hover:line-clamp-5">
              <span>
                {{ version.message || 'No message' }}
              </span>
            </div>
          </div>
        </button>
      </div>
      <CommonLoadingBar v-if="loading" loading />
      <FormButton size="xs" full-width :disabled="hasReachedEnd" @click="loadMore">
        {{ hasReachedEnd ? 'No more versions' : 'Load older versions' }}
      </FormButton>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useQuery } from '@vue/apollo-composable'
import { modelVersionsQuery } from '~/lib/graphql/mutationsAndQueries'
import { SourceApps, SourceAppName } from '@speckle/shared'
import { VersionListItemFragment } from '~/lib/common/generated/gql/graphql'

defineEmits<{
  (e: 'next', version: VersionListItemFragment): void
}>()

const props = defineProps<{
  accountId: string
  projectId: string
  modelId: string
}>()

const {
  result: modelVersionResults,
  loading,
  fetchMore
} = useQuery(
  modelVersionsQuery,
  () => ({
    projectId: props.projectId,
    modelId: props.modelId,
    limit: 5
  }),
  () => ({ clientId: props.accountId })
)

const versions = computed(() => modelVersionResults.value?.project.model.versions.items)
const hasReachedEnd = ref(false)

const loadMore = () => {
  fetchMore({
    variables: { cursor: modelVersionResults.value?.project.model.versions.cursor },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (
        !fetchMoreResult ||
        fetchMoreResult.project.model.versions.items.length === 0
      ) {
        hasReachedEnd.value = true
        return previousResult
      }
      return {
        project: {
          id: previousResult.project.id,
          __typename: previousResult.project.__typename,
          model: {
            id: previousResult.project.model.id,
            __typename: previousResult.project.model.__typename,
            versions: {
              __typename: previousResult.project.model.versions.__typename,
              totalCount: previousResult.project.model.versions.totalCount,
              cursor: fetchMoreResult?.project.model.versions.cursor,
              items: [
                ...previousResult.project.model.versions.items,
                ...fetchMoreResult.project.model.versions.items
              ]
            }
          }
        }
      }
    }
  })
}
</script>
