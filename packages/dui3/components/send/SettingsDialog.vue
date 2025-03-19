<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <CommonDialog
      v-model:open="showSettingsDialog"
      :title="`Settings`"
      fullscreen="none"
    >
      <SendSettings
        :expandable="false"
        :settings="props.settings"
        @update:settings="updateSettings"
      ></SendSettings>
      <div class="mt-4 flex justify-end items-center space-x-2">
        <FormButton size="sm" color="outline" @click="showSettingsDialog = false">
          Cancel
        </FormButton>
        <FormButton size="sm" @click="saveSettings()">Save</FormButton>
      </div>
    </CommonDialog>
  </div>
</template>

<script setup lang="ts">
import { useMixpanel } from '~/lib/core/composables/mixpanel'
import { useHostAppStore } from '~/store/hostApp'
import type { CardSetting } from '~/lib/models/card/setting'

const { trackEvent } = useMixpanel()

const props = defineProps<{
  settings?: CardSetting[]
  modelCardId: string
}>()

const store = useHostAppStore()

const showSettingsDialog = ref(false)

const toggleDialog = () => {
  showSettingsDialog.value = !showSettingsDialog.value
}

let newSettings: CardSetting[]
const updateSettings = (settings: CardSetting[]) => {
  newSettings = settings
}

const saveSettings = async () => {
  void trackEvent('DUI3 Action', {
    name: 'Send Settings Updated'
  })
  await store.patchModel(props.modelCardId, {
    settings: newSettings,
    expired: true
  })
  showSettingsDialog.value = false
}
</script>
