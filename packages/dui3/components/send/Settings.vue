<template>
  <div class="p-0">
    <button
      v-if="expandable"
      class="flex w-full items-center text-foreground-2 justify-between hover:foundation-3 rounded-md transition group mb-2"
      @click="showSettings = !showSettings"
    >
      <div class="flex items-center transition group-hover:text-primary h-8 min-w-0">
        <CommonIconsArrowFilled
          :class="`w-5 ${showSettings ? '' : '-rotate-90'} transition`"
        />
        <div class="text-body-sm text-left select-none">Settings</div>
      </div>
    </button>
    <div v-show="showSettings" class="px-1">
      <FormJsonForm
        :schema="settingsJsonForms"
        :data="data"
        @change="onParamsFormChange"
      ></FormJsonForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardSetting, CardSettingValue } from '~/lib/models/card/setting'
import type { JsonFormsChangeEvent } from '@jsonforms/vue'
import { cloneDeep, omit } from 'lodash-es'
import type { JsonSchema } from '@jsonforms/core'
import { useHostAppStore } from '~/store/hostApp'

const props = defineProps<{
  settings?: CardSetting[]
  expandable: boolean
}>()

const emit = defineEmits<{ (e: 'update:settings', value: CardSetting[]): void }>()

const store = useHostAppStore()

const defaultSendSettings = computed(() => store.sendSettings)
const sendSettings = ref<CardSetting[] | undefined>(
  cloneDeep(props.settings ?? defaultSendSettings.value) // need to prevent mutation!
)

const showSettings = ref(!props.expandable)

const settingsJsonForms = computed(() => {
  if (sendSettings.value === undefined) return {}
  const obj: JsonSchema = { type: 'object', properties: {} }
  sendSettings.value.forEach((setting: CardSetting) => {
    const mappedSetting = omit({ ...setting, $id: setting.id }, ['id'])
    if (obj && obj.properties) {
      obj.properties[setting.id] = mappedSetting
    }
  })
  return obj
})

type DataType = Record<string, unknown>
const data = computed(() => {
  const settingValues = {} as DataType
  if (sendSettings.value) {
    sendSettings.value.forEach((setting) => {
      settingValues[setting.id as string] = setting.value
    })
  }
  return settingValues
})

const onParamsFormChange = (e: JsonFormsChangeEvent) => {
  if (sendSettings.value === undefined) return
  sendSettings.value?.forEach((setting) => {
    if (setting) {
      if (setting.value !== (e.data as DataType)[setting.id]) {
        setting.value = (e.data as DataType)[setting.id] as CardSettingValue
      }
    }
  })
  emit('update:settings', sendSettings.value)
}
</script>
