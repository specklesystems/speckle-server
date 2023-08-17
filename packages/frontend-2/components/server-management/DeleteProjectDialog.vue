<template>
  <LayoutDialog v-model:open="isOpen" max-width="sm" :title="title" :buttons="buttons">
    <div class="flex flex-col gap-6">
      <p>
        Are you sure you want to
        <strong>permanently delete</strong>
        the selected project?
      </p>
      <div v-if="project">
        <strong>{{ project.name }}</strong>
        <p>
          {{ isProject(project) ? project.models.totalCount : '' }} models,
          {{ isProject(project) ? project.versions.totalCount : '' }} versions,
        </p>
      </div>
      <p>
        This action
        <strong>cannot</strong>
        be undone.
      </p>
    </div>
  </LayoutDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDialog } from '@speckle/ui-components'
import { ItemType } from '~~/lib/server-management/helpers/types'
import { isProject } from '~~/lib/server-management/helpers/utils'

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
}>()

const props = defineProps<{
  title: string
  open: boolean
  project: ItemType | null
}>()

const isOpen = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})
</script>
