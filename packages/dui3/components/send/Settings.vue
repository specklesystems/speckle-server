<template>
  <div class="p-0">
    <FormJsonForm
      :schema="settingsJsonForms"
      :data="data"
      @change="onParamsFormChange"
    ></FormJsonForm>
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
}>()

const emit = defineEmits<{ (e: 'update:settings', value: CardSetting[]): void }>()

const store = useHostAppStore()

const defaultSendSettings = computed(() => store.sendSettings)
console.log('defaultSendSettings', defaultSendSettings.value)
const sendSettings = ref<CardSetting[] | undefined>(
  cloneDeep(props.settings ?? defaultSendSettings.value) // need to prevent mutation!
)

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
