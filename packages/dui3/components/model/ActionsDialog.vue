<template>
  <div>
    <button
      class="transition hover:text-primary"
      @click="openModelCardActionsDialog = true"
    >
      <Cog6ToothIcon class="w-4" />
    </button>
    <LayoutDialog v-model:open="openModelCardActionsDialog" hide-closer>
      <div class="-mx-6 -my-6">
        <button
          v-for="item in items"
          :key="item.name"
          :class="`action ${item.danger ? 'action-danger' : 'action-normal'}`"
          @click="item.action"
        >
          <div class="truncate max-[275px]:text-xs">{{ item.name }}</div>
          <div>
            <Component :is="item.icon" class="w-5 h-5" />
          </div>
        </button>
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import {
  Cog6ToothIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  TrashIcon,
  ArchiveBoxXMarkIcon
} from '@heroicons/vue/24/outline'

const openModelCardActionsDialog = ref(false)
const emit = defineEmits(['view', 'view-versions', 'copy-model-link', 'remove'])

const items = [
  {
    name: 'View 3D model in browser',
    icon: ArrowTopRightOnSquareIcon,
    action: () => {
      emit('view')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'View model versions',
    icon: ClockIcon,
    action: () => {
      emit('view-versions')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'Copy model link',
    icon: LinkIcon,
    action: () => {
      emit('copy-model-link')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'Remove from file',
    danger: true,
    icon: ArchiveBoxXMarkIcon,
    action: () => {
      emit('remove')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'Delete from file and project',
    danger: true,
    icon: TrashIcon,
    action: () => {
      emit('delete-full')
      openModelCardActionsDialog.value = false
    }
  }
]
</script>
<style scoped lang="postcss">
.action {
  @apply flex items-center justify-between w-full rounded-lg text-left items-center space-x-2 transition p-2 select-none hover:cursor-pointer min-w-0;
}

.action-normal {
  @apply text-primary hover:bg-primary-muted;
}
.action-danger {
  @apply text-danger hover:bg-rose-500/10;
}
</style>
