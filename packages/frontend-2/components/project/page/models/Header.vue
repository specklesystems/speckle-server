<template>
  <div>
    <div
      class="flex flex-col space-y-2 xl:space-y-0 xl:flex-row xl:justify-between xl:items-center mb-4"
    >
      <div class="flex justify-between items-center flex-wrap xl:flex-nowrap">
        <h1 class="block text-heading-xl">Models</h1>
        <div class="flex items-center space-x-2 w-full mt-2 sm:w-auto sm:mt-0">
          <FormButton
            color="outline"
            :disabled="project?.models.totalCount === 0"
            class="grow inline-flex sm:grow-0 lg:hidden"
            @click="onViewAllClick"
          >
            View all in 3D
          </FormButton>
          <FormButton
            v-if="canContribute"
            class="grow inline-flex sm:grow-0 lg:hidden"
            @click="showNewDialog = true"
          >
            New model
          </FormButton>
        </div>
      </div>
      <div
        class="flex flex-col space-y-2 xl:space-y-0 xl:flex-row xl:items-center xl:space-x-2"
      >
        <FormTextInput
          v-model="localSearch"
          name="modelsearch"
          :show-label="false"
          placeholder="Search models..."
          color="foundation"
          wrapper-classes="grow lg:grow-0 xl:ml-2 xl:w-40 min-w-40 shrink-0"
          :show-clear="localSearch !== ''"
          @change="($event) => updateSearchImmediately($event.value)"
          @update:model-value="updateDebouncedSearch"
        />
        <div
          class="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0"
        >
          <FormSelectUsers
            v-model="finalSelectedMembers"
            :users="team"
            multiple
            selector-placeholder="All members"
            label="Filter by members"
            class="grow shrink sm:w-[120px] md:w-44"
            clearable
            fixed-height
          />
          <div class="flex items-center space-x-2 grow">
            <FormSelectSourceApps
              v-model="finalSelectedApps"
              :items="availableSourceApps"
              multiple
              selector-placeholder="All sources"
              label="Filter by sources"
              class="grow shrink sm:w-[120px] md:w-44"
              clearable
              fixed-height
              :label-id="sourceAppsLabelId"
              :button-id="sourceAppsBtnId"
            />
            <LayoutGridListToggle v-model="finalGridOrList" class="shrink-0" />
          </div>
          <FormButton
            color="outline"
            class="hidden lg:inline-flex shrink-0"
            :disabled="project?.models.totalCount === 0"
            @click="onViewAllClick"
          >
            View all in 3D
          </FormButton>
          <FormButton
            v-if="canContribute"
            class="hidden lg:inline-flex shrink-0"
            @click="showNewDialog = true"
          >
            New model
          </FormButton>
        </div>
      </div>
    </div>
    <ProjectPageModelsNewDialog v-model:open="showNewDialog" :project-id="projectId" />
  </div>
</template>
<script setup lang="ts">
import { SourceApps, SpeckleViewer } from '@speckle/shared'
import type { SourceAppDefinition } from '@speckle/shared'
import { debounce } from 'lodash-es'
import { graphql } from '~~/lib/common/generated/gql'
import type {
  FormUsersSelectItemFragment,
  ProjectModelsPageHeader_ProjectFragment
} from '~~/lib/common/generated/gql/graphql'
import { modelRoute } from '~~/lib/common/helpers/route'
import type { GridListToggleValue } from '~~/lib/layout/helpers/components'
import { canModifyModels } from '~~/lib/projects/helpers/permissions'
import { useMixpanel } from '~~/lib/core/composables/mp'

const emit = defineEmits<{
  (e: 'update:selected-members', val: FormUsersSelectItemFragment[]): void
  (e: 'update:selected-apps', val: SourceAppDefinition[]): void
  (e: 'update:grid-or-list', val: GridListToggleValue): void
  (e: 'update:search', val: string): void
}>()

graphql(`
  fragment ProjectModelsPageHeader_Project on Project {
    id
    name
    sourceApps
    role
    models {
      totalCount
    }
    team {
      id
      user {
        ...FormUsersSelectItem
      }
    }
  }
`)

const props = defineProps<{
  projectId: string
  project?: ProjectModelsPageHeader_ProjectFragment
  selectedMembers: FormUsersSelectItemFragment[]
  selectedApps: SourceAppDefinition[]
  search: string
  gridOrList: GridListToggleValue
  disabled?: boolean
}>()

const localSearch = ref('')
const sourceAppsLabelId = useId()
const sourceAppsBtnId = useId()
const router = useRouter()
const mp = useMixpanel()

const onViewAllClick = () => {
  router.push(allModelsRoute.value)

  mp.track('Viewer Action', {
    type: 'action',
    name: 'federation',
    action: 'view-all',
    source: 'project page'
  })
}

const canContribute = computed(() =>
  props.project ? canModifyModels(props.project) : false
)
const showNewDialog = ref(false)

const debouncedSearch = computed({
  get: () => props.search,
  set: (newVal) => emit('update:search', newVal)
})
const finalSelectedMembers = computed({
  get: () => props.selectedMembers,
  set: (newVal) => emit('update:selected-members', newVal)
})
const finalSelectedApps = computed({
  get: () => props.selectedApps,
  set: (newVal) => emit('update:selected-apps', newVal)
})
const finalGridOrList = computed({
  get: () => props.gridOrList,
  set: (newVal) => emit('update:grid-or-list', newVal)
})

const availableSourceApps = computed((): SourceAppDefinition[] =>
  props.project
    ? SourceApps.filter((a) =>
        props.project!.sourceApps.find((pa) => pa.toLowerCase().includes(a.searchKey))
      )
    : []
)

const allModelsRoute = computed(() => {
  const resourceIdString = SpeckleViewer.ViewerRoute.resourceBuilder()
    .addAllModels()
    .toString()
  return modelRoute(props.projectId, resourceIdString)
})

const team = computed(() => props.project?.team.map((t) => t.user) || [])

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = localSearch.value.trim()
}, 500)

const updateSearchImmediately = (val?: string) => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = (val ?? localSearch.value).trim()
}

watch(debouncedSearch, (newVal) => {
  if (newVal !== localSearch.value) {
    localSearch.value = newVal
  }
})
</script>
