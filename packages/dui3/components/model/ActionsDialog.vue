<template>
  <div>
    <button
      class="transition hover:text-primary"
      @click.stop="openModelCardActionsDialog = true"
    >
      <Cog6ToothIcon class="w-4" />
    </button>
    <LayoutDialog
      v-model:open="openModelCardActionsDialog"
      :title="`${modelName} actions`"
      fullscreen="none"
    >
      <div class="-mx-1">
        <AutomateCreateDialog
          :project-id="props.modelCard.projectId"
          :model-id="props.modelCard.modelId"
        >
          <template #activator="{ toggle }">
            <button class="action action-normal" @click="toggle()">
              <div class="truncate max-[275px]:text-xs">Create Automation</div>
              <div><BoltIcon class="w-5 h-5" /></div>
            </button>
          </template>
        </AutomateCreateDialog>
        <SendSettingsDialog
          v-if="hasSettings"
          :model-card-id="props.modelCard.modelCardId"
          :settings="props.modelCard.settings"
        >
          <template #activator="{ toggle }">
            <button class="action action-normal" @click="toggle()">
              <div class="truncate max-[275px]:text-xs">Settings</div>
              <div><Cog6ToothIcon class="w-5 h-5" /></div>
            </button>
          </template>
        </SendSettingsDialog>
        <ReportBase v-if="modelCard.report" :report="modelCard.report">
          <template #activator="{ toggle }">
            <button class="action action-normal" @click="toggle()">
              <div class="truncate max-[275px]:text-xs">View Report</div>
              <div><InformationCircleIcon class="w-5 h-5" /></div>
            </button>
          </template>
        </ReportBase>
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
  InformationCircleIcon,
  Cog6ToothIcon,
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  ArchiveBoxXMarkIcon,
  BoltIcon
} from '@heroicons/vue/24/outline'
import type { IModelCard } from '~/lib/models/card'
import { useMixpanel } from '~/lib/core/composables/mixpanel'

const { trackEvent } = useMixpanel()

const openModelCardActionsDialog = ref(false)
const emit = defineEmits(['view', 'view-versions', 'copy-model-link', 'remove'])

const props = defineProps<{
  modelName: string
  modelCard: IModelCard
}>()

const hasSettings = computed(() => {
  return !!props.modelCard.settings
})

const app = useNuxtApp()
app.$baseBinding.on('documentChanged', () => {
  openModelCardActionsDialog.value = false
})

const items = [
  {
    name: 'View 3D model in browser',
    icon: ArrowTopRightOnSquareIcon,
    action: () => {
      void trackEvent('DUI3 Action', {
        name: 'Version View',
        source: 'model actions dialog'
      })
      emit('view')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'View model versions',
    icon: ClockIcon,
    action: () => {
      void trackEvent('DUI3 Action', {
        name: 'Model History View',
        source: 'model actions dialog'
      })
      emit('view-versions')
      openModelCardActionsDialog.value = false
    }
  },
  {
    name: 'Remove from file',
    danger: true,
    icon: ArchiveBoxXMarkIcon,
    action: () => {
      // NOTE: Mixpanel event tracking is in host app store
      emit('remove')
      openModelCardActionsDialog.value = false
    }
  }
]
</script>
<style scoped lang="postcss">
.action {
  @apply flex items-center justify-between w-full rounded-lg text-left space-x-2 transition p-2 select-none hover:cursor-pointer min-w-0;
}

.action-normal {
  @apply text-primary hover:bg-primary-muted;
}

.action-danger {
  @apply text-danger hover:bg-rose-500/10;
}
</style>
