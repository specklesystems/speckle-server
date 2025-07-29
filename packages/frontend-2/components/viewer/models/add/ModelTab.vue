<template>
  <div class="flex flex-col gap-y-2">
    <FormTextInput
      v-model="search"
      name="modelsearch"
      :show-label="false"
      placeholder="Search models..."
      color="foundation"
      full-width
      :show-clear="search !== ''"
      auto-focus
      @change="updateSearchImmediately"
      @update:model-value="updateDebouncedSearch"
    />
    <CommonLoadingBar :loading="showLoadingBar" />
    <ProjectPageModelsCardView
      v-if="project"
      :search="debouncedSearch"
      :project="project"
      :project-id="project.id"
      :excluded-ids="alreadyLoadedModelIds"
      small-view
      :show-actions="false"
      :show-versions="false"
      disable-default-links
      exclude-empty-models
      hide-file-upload
      @update:loading="($event) => (queryLoading = $event)"
      @model-clicked="onModelClicked"
      @clear-search="clear"
    />
  </div>
</template>
<script setup lang="ts">
import { debounce } from 'lodash-es'
import { useInjectedViewerLoadedResources } from '~~/lib/viewer/composables/setup'

const emit = defineEmits<{
  (e: 'chosen', val: { modelId: string }): void
}>()

const { project, resourceItems } = useInjectedViewerLoadedResources()

const search = ref('')
const debouncedSearch = ref('')
const queryLoading = ref(false)
const showLoadingBar = ref(false)

const alreadyLoadedModelIds = computed(() =>
  resourceItems.value
    .map((i) => i.modelId)
    .filter((id): id is NonNullable<typeof id> => !!id)
)

const updateDebouncedSearch = debounce(() => {
  debouncedSearch.value = search.value.trim()
}, 500)

const updateSearchImmediately = () => {
  updateDebouncedSearch.cancel()
  debouncedSearch.value = search.value.trim()
}

const onModelClicked = ({ id }: { id: string }) => {
  emit('chosen', { modelId: id })
}

const clear = () => {
  search.value = ''
  updateSearchImmediately()
}

watch(search, (newVal) => {
  if (newVal) showLoadingBar.value = true
  else showLoadingBar.value = false
})

watch(queryLoading, (newVal) => (showLoadingBar.value = !!newVal))
</script>
