<!-- NOT WILL BE USED SINCE WE ENABLE AUTOMATION CREATION FROM DUI3 -->
<template>
  <div class="p-0">
    <slot name="activator" :toggle="toggleDialog"></slot>
    <LayoutDialog
      v-model:open="showAutomateDialog"
      :title="`Settings`"
      fullscreen="none"
    >
      <div v-if="hasFunctions">
        <FormSelectBase
          key="name"
          v-model="selectedFunction"
          clearable
          label="Automate functions"
          placeholder="Nothing selected"
          name="Functions"
          show-label
          :items="functions"
          mount-menu-on-body
        >
          <template #something-selected="{ value }">
            <span>{{ value.name }}</span>
          </template>
          <template #option="{ item }">
            <div class="flex items-center">
              <span class="truncate">{{ item.name }}</span>
            </div>
          </template>
        </FormSelectBase>
      </div>
      <div v-if="selectedFunction && finalParams && step === 0">
        <FormJsonForm
          ref="jsonForm"
          :data="data"
          :schema="finalParams"
          class="space-y-4"
          :validate-on-mount="false"
          @change="handler"
        />
      </div>
      <div v-if="step === 1">
        <FormTextInput
          v-model="automationName"
          name="automationName"
          label="Automation name"
          color="foundation"
          show-label
          help="Give your automation a name"
          placeholder="Name"
          show-required
          validate-on-value-update
        />
      </div>
      <FormButton
        v-if="selectedFunction && step === 0"
        size="sm"
        class="mt-4"
        @click="step++"
      >
        Next
      </FormButton>
      <FormButton
        v-if="selectedFunction && step === 1"
        size="sm"
        class="mt-4"
        @click="createAutomationHandler"
      >
        Create
      </FormButton>
    </LayoutDialog>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import type { AutomateFunctionItemFragment } from '~/lib/common/generated/gql/graphql'
import {
  automateFunctionsQuery,
  createAutomationMutation
} from '~/lib/graphql/mutationsAndQueries'
import { provideApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { useAccountStore } from '~/store/accounts'
import type { ApolloError } from '@apollo/client/errors'
import { formatVersionParams } from '~/lib/common/helpers/jsonSchema'
import { useJsonFormsChangeHandler } from '~/lib/core/composables/jsonSchema'

const props = defineProps<{
  projectId: string
  modelId: string
}>()

const step = ref<number>(0)

const automationName = ref<string>('')

const accountStore = useAccountStore()
const { activeAccount } = storeToRefs(accountStore)
const accountId = computed(() => activeAccount.value?.accountInfo.id) // NOTE: none of the tokens here has read, write access to automate, only frontend tokens have. Keep in mind after first pass!

const selectedFunction = ref<AutomateFunctionItemFragment>()

const showAutomateDialog = ref(false)

const toggleDialog = () => {
  showAutomateDialog.value = !showAutomateDialog.value
}

const { mutate } = provideApolloClient(activeAccount.value.client)(() =>
  useMutation(createAutomationMutation)
)

const createAutomationHandler = async () => {
  const _res = await mutate({
    projectId: props.projectId,
    input: { name: automationName.value, enabled: false }
  })
  showAutomateDialog.value = false
}

const { result: functionsResult, onError } = useQuery(
  automateFunctionsQuery,
  () => ({}),
  () => ({ clientId: accountId.value, debounce: 500, fetchPolicy: 'network-only' })
)

onError((err: ApolloError) => {
  console.warn(err.message)
})

const functions = computed(() => functionsResult.value?.automateFunctions.items)
const hasFunctions = computed(() => functions.value?.length !== 0)

const release = computed(() =>
  selectedFunction.value?.releases.items.length
    ? selectedFunction.value?.releases.items[0]
    : undefined
)

const finalParams = computed(() => formatVersionParams(release.value?.inputSchema))

const { handler } = useJsonFormsChangeHandler({
  schema: finalParams
})

console.log(finalParams)

type DataType = Record<string, unknown>
const data = computed(() => {
  const kvp = {} as DataType
  if (finalParams.value) {
    Object.entries(finalParams.value).forEach((k, _) => {
      kvp[k as unknown as string] = undefined
    })
  }
  return kvp
})
</script>
