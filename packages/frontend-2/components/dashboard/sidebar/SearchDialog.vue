<template>
  <LayoutDialog v-model:open="isOpen" max-width="lg" hide-closer>
    <div class="w-full h-96 flex flex-col">
      <FormTextInput
        v-model="searchValue"
        name="search"
        :placeholder="`Search ${result?.workspaceBySlug.name}`"
      />
      <hr class="mt-2 mb-2" />
      <div class="w-full h-full flex flex-col justify-start overflow-hidden">
        <div
          v-for="(entry, i) in entries"
          :key="`${i}-${entry.objectId}`"
          class="w-full h-12 flex items-center justify-between"
        >
          <NuxtLink
            class="p-2 rounded-md flex flex-grow items-center hover:bg-foundation-focus"
            :to="modelRoute(entry.projectId, `${entry.modelId}@${entry.versionId}`)"
          >
            <CubeIcon class="size-4 text-foreground-3 mr-2" />
            <p class="text-body-xs font-medium text-foreground text-nowrap pr-2">
              {{ getProjectName(entry.projectId) }}
            </p>
            -
            <p class="pl-2 mr-4 text-body-xs font-light text-foreground text-nowrap">
              {{ entry.name.toLowerCase() }}: {{ entry.value.toLowerCase() }}
            </p>
            <CommonBadge>{{ entry.category }}</CommonBadge>
          </NuxtLink>
          <NuxtLink
            :to="modelRoute(entry.projectId, entry.objectId)"
            class="h-full flex items-center ml-4"
          >
            <p
              class="w-full text-right text-body-2xs font-light text-foreground hover:underline"
            >
              {{ entry.objectId.substring(0, 6) }}
            </p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { useDebounceFn } from '@vueuse/core'
import { CubeIcon } from '@heroicons/vue/24/outline'
import type { WorkspaceSearchResult } from '~/lib/common/generated/gql/graphql'
import {
  navigationActiveWorkspaceQuery,
  workspaceSearchQuery
} from '~/lib/navigation/graphql/queries'
import { modelRoute } from '~/lib/common/helpers/route'
// import type { Workspace } from '~/lib/common/generated/gql/graphql'

const props = defineProps<{
  workspaceSlug: string | null
}>()

const apollo = useApolloClient().client

const { result } = useQuery(
  navigationActiveWorkspaceQuery,
  () => ({ slug: props.workspaceSlug! }),
  () => ({
    enabled: !!props.workspaceSlug
  })
)

// const { result: searchResult } = useQuery(
//   workspaceSearchQuery,
//   () => ({
//     workspaceSlug: props.workspaceSlug!,
//     query: searchValue.value
//   }),
//   () => ({
//     enabled: !!searchValue.value.length && enableSearch.value && !!props.workspaceSlug,
//     prefetch: false,
//     pollInterval: 0
//   })
// )

const getProjectName = (projectId: string): string => {
  switch (projectId) {
    case 'e7ab1f6099': {
      return '415 Wick Lane'
    }
    case '4606771bd3': {
      return '340 E 34th St'
    }
    case '2c20502224': {
      return '1988 Hospital'
    }
    default: {
      return 'ProjectName'
    }
  }
}

const isOpen = defineModel<boolean>('isOpen', { required: true })

const searchValue = ref<string>('')
const searchResults = ref<WorkspaceSearchResult[]>([])

const handleUpdateSearch = useDebounceFn(async (value: string) => {
  if (!props.workspaceSlug) return

  const res = await apollo.query({
    query: workspaceSearchQuery,
    variables: {
      workspaceSlug: props.workspaceSlug,
      query: value
    }
  })

  searchResults.value = res?.data?.workspaceBySlug?.search ?? []
}, 300)

const entries = computed(() => {
  // return [] as WorkspaceSearchResult[]
  return searchResults?.value?.map((entry) => entry) ?? []
})

watch(searchValue, (val) => handleUpdateSearch(val))
</script>
