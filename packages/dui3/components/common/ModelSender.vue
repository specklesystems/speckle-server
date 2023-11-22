<template>
  <div class="flex items-center space-x-2">
    <UserAvatar :user="modelDetails.author" size="sm" />
    <span v-tippy="modelDetails.displayName" class="truncate">
      {{
        modelDetails.displayName.length > 8
          ? modelDetails.displayName.slice(0, 8) + '...'
          : modelDetails.displayName
      }}
    </span>
  </div>
  <div class="flex items-center space-x-2">
    <FormButton
      v-tippy="'Change or edit filter'"
      size="sm"
      text
      :icon-left="FunnelIcon"
      @click="openFilterDialog = true"
    >
      {{ model.sendFilter.name }}
    </FormButton>
    <FormButton
      v-if="!model.sending"
      v-tippy="'Publish'"
      size="sm"
      :icon-left="CloudArrowUpIcon"
      :text="!model.expired"
      class="flex items-center justify-center"
      @click="store.sendModel(model.id)"
    >
      Publish
    </FormButton>
    <FormButton
      v-else
      v-tippy="'Cancel'"
      size="sm"
      class="flex items-center justify-center"
      @click="store.sendModelCancel(model.id)"
    >
      Cancel
    </FormButton>
    <FormButton
      v-if="props.model.settings"
      v-tippy="'Settings'"
      class="px-0"
      size="sm"
      text
      hide-text
      :icon-left="Cog6ToothIcon"
      @click="openSettingDialog = true"
    ></FormButton>
    <LayoutDialog v-model:open="openSettingDialog">
      <div class="h5 font-semibold pb-2">Publish Settings</div>
      <hr class="pb-3" />
      <FormJsonForm
        :schema="settingsJsonForms"
        @change="onParamsFormChange"
      ></FormJsonForm>
    </LayoutDialog>
  </div>
  <LayoutDialog v-model:open="openFilterDialog">
    <FilterEditDialog :model="model" @close="openFilterDialog = false" />
  </LayoutDialog>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, FunnelIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { ISenderModelCard } from '~~/lib/models/card/send'
import { useGetModelDetails } from '~~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~~/store/hostApp'
import { JsonFormsChangeEvent } from '@jsonforms/vue'
import { JsonSchema } from '@jsonforms/core'
import { CardSetting } from '~/lib/models/card/setting'
import { omit } from 'lodash-es'

const openSettingDialog = ref(false)
const store = useHostAppStore()

const props = defineProps<{
  model: ISenderModelCard
  project: ProjectModelGroup
}>()

const settingsJsonForms = computed(() => {
  if (props.model.settings === undefined) return {}
  const obj: JsonSchema = {
    type: 'object',
    properties: {}
  }
  props.model.settings.forEach((setting: CardSetting) => {
    const mappedSetting = omit({ ...setting, $id: setting.id }, ['id'])
    if (obj && obj.properties) {
      obj.properties[setting.id] = mappedSetting
    }
  })
  return obj
})

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const openFilterDialog = ref(false)

const paramsFormState = ref<JsonFormsChangeEvent>()
const onParamsFormChange = (e: JsonFormsChangeEvent) => {
  paramsFormState.value = e
  console.log(JSON.parse(JSON.stringify(e.data)))
}
</script>
