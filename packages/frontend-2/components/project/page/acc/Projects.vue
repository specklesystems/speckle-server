<template>
  <div>
    <FormSelectBase
      v-model="selectedProject"
      name="accProjects"
      label="Projects"
      show-label
      :items="projects"
      size="base"
      color="foundation"
      placeholder="Select hub"
      @update:model-value="handleProjectChange"
    >
      <template #something-selected="{ value }">
        {{ isArray(value) ? value[0].attributes.name : value.attributes.name }}
      </template>
      <template #option="{ item }">
        {{ item.attributes.name }}
      </template>
    </FormSelectBase>

    <div v-if="!loading && projects.length == 0" class="text-xs italic">
      No projects found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { isArray } from 'lodash-es'
import type { AccProject } from '@speckle/shared/acc'

const props = defineProps<{
  hubId: string
  projects: AccProject[]
  loading: boolean
}>()

const emits = defineEmits<{
  (e: 'project-selected', hubId: string, projectId: string): void
}>()

const selectedProject = ref<AccProject>()

const handleProjectChange = (newProject: AccProject | AccProject[] | undefined) => {
  // is array not likely but make TS happy
  if (!newProject || isArray(newProject)) {
    return
  }
  emits('project-selected', props.hubId, newProject.id)
}

watch(
  () => props.projects,
  (newProjects) => {
    if (newProjects.length > 0) {
      selectedProject.value = newProjects[0]
      emits('project-selected', props.hubId, newProjects[0].id)
    }
  },
  { immediate: true }
)
</script>
