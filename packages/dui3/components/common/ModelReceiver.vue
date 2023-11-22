<template>
  <div class="flex items-center space-x-2">
    <UserAvatar :user="modelDetails.author" size="sm" />
    <span>{{ modelDetails.displayName }}</span>
  </div>
  <div class="flex items-center space-x-2">
    <FormButton
      v-if="!model.receiving"
      v-tippy="'Load'"
      size="sm"
      :icon-left="CloudArrowDownIcon"
      :text="!model.expired"
      class="flex items-center justify-center"
      @click="store.receiveModel(model.id, selectedVersion?.id as string)"
    >
      Load
    </FormButton>
    <FormButton
      v-else
      v-tippy="'Cancel'"
      size="sm"
      class="flex items-center justify-center"
      @click="store.receiveModelCancel(model.id)"
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
      <div class="h5 font-semibold pb-2">Load Settings</div>
      <hr class="pb-3" />
      <FormJsonForm
        :schema="settingsJsonForms"
        @change="onParamsFormChange"
      ></FormJsonForm>
    </LayoutDialog>
  </div>
</template>

<script setup lang="ts">
import { CloudArrowDownIcon, Cog6ToothIcon } from '@heroicons/vue/24/outline'
import { IReceiverModelCard } from '~/lib/models/card/receiver'
import { VersionsSelectItemType } from '~/lib/form/select/types'
import { useGetModelDetails, useProjectVersionUpdated } from '~/lib/graphql/composables'
import { ProjectModelGroup, useHostAppStore } from '~/store/hostApp'
import { JsonFormsChangeEvent } from '@jsonforms/vue'
import { omit } from 'lodash-es'
import { JsonSchema } from '@jsonforms/core'
import { CardSetting } from '~/lib/models/card/setting'

const openSettingDialog = ref(false)
const store = useHostAppStore()

const settingsJsonForms = computed(() => {
  if (props.model.settings === undefined) return {}
  const obj: JsonSchema = { type: 'object', properties: {} }
  props.model.settings.forEach((setting: CardSetting) => {
    const mappedSetting = omit({ ...setting, $id: setting.id }, ['id'])
    if (obj && obj.properties) {
      obj.properties[setting.id] = mappedSetting
    }
  })
  return obj
})

const props = defineProps<{
  model: IReceiverModelCard
  project: ProjectModelGroup
}>()

const selectedVersion = ref<VersionsSelectItemType>()

const getModelDetails = useGetModelDetails(props.project.accountId)

const modelDetails = await getModelDetails({
  projectId: props.model.projectId,
  modelId: props.model.modelId
})

const onProjectVersionsUpdate = useProjectVersionUpdated()
const projectVersionsUpdated = onProjectVersionsUpdate(props.project.projectId)

projectVersionsUpdated.onResult(() => store.invalidateReceiver(props.model.id))

const paramsFormState = ref<JsonFormsChangeEvent>()
const onParamsFormChange = (e: JsonFormsChangeEvent) => {
  paramsFormState.value = e
  console.log(e)
}
</script>
