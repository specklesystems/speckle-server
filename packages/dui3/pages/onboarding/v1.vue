<template>
  <div
    class="flex flex-col items-center justify-center h-[calc(100vh-16rem)] px-4 space-y-2"
  >
    <!-- STEP 0 -->
    <div v-if="step === 0" class="space-y-4 w-full">
      <div class="h3">Let's publish our first model to Speckle.</div>
      <div
        v-if="!hasSelectedSomethingNow && selectionInfo.selectedObjectIds?.length === 0"
        class="h4 text-primary"
      >
        First: select a part of your model.
      </div>
      <div
        v-if="hasSelectedSomethingNow || selectionInfo.selectedObjectIds?.length !== 0"
        class="h4 text-primary flex items-center space-x-2"
      >
        <span>Great object selection! {{ selectionInfo.summary }}</span>
      </div>
      <div v-if="!hasSelectedSomethingNow" class="text-foreground-2 text-xs">
        Or continue with publishing
        <FormButton text size="xs" @click="saveSelectionAndNext">
          the whole model.
        </FormButton>
        This might take a bit longer.
      </div>
      <div class="flex items-center justify-between">
        <FormButton text size="sm" @click="step--">Back</FormButton>
        <FormButton
          :disabled="!hasSelectedSomethingNow"
          :icon-right="ChevronRightIcon"
          @click="saveSelectionAndNext"
        >
          Let's publish!
        </FormButton>
      </div>
    </div>
    <!-- STEP 1 -->
    <div v-if="step === 1" class="space-y-4 w-full">
      <div class="h4">
        What shall we call this
        <b class="text-primary">model</b>
        ?
      </div>
      <div class="text-sm text-foreground-2">
        Models in speckle are bla bla, bla bla. Lorem ipsum, painful amet
      </div>
      <div>
        <FormTextInput
          v-model="modelName"
          size="xl"
          color="foundation"
          name="modelName"
          placeholder="My First Model"
        />
      </div>
      <div class="flex items-center justify-between">
        <FormButton text size="sm" @click="step--">Back</FormButton>
        <FormButton
          :disabled="modelName.length < 1"
          :icon-right="ChevronRightIcon"
          @click="step++"
        >
          Next
        </FormButton>
      </div>
    </div>
    <!-- STEP 2 -->
    <div v-if="step === 2" class="space-y-4 w-full">
      <div class="h4">
        What
        <b class="text-primary">project</b>
        is this model part of?
      </div>
      <div class="text-sm text-foreground-2">
        Projects in speckle are bla bla, bla bla. Lorem ipsum, painful amet
      </div>

      <div class="h4">
        <FormTextInput
          v-model="projectName"
          size="xl"
          color="foundation"
          name="projectName"
          placeholder="My First Project"
        />
      </div>
      <div class="flex items-center justify-between">
        <FormButton text size="sm" @click="step--">Back</FormButton>
        <FormButton
          :disabled="projectName.length < 1"
          :icon-right="CloudArrowUpIcon"
          @click="publish()"
        >
          Publish
        </FormButton>
      </div>
    </div>
    <div class="text-xs text-foreground-2 w-full">
      Debug Current state:
      <br />
      - selection info: {{ selectionFilterCopy?.summary }}
      <br />
      - model name: {{ modelName }}
      <br />
      - project name: {{ projectName }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { CloudArrowUpIcon, ChevronRightIcon } from '@heroicons/vue/20/solid'
import { SelectionInfo } from '~~/lib/bindings/definitions/ISelectionBinding'
import { useSelectionStore } from '~~/store/selection'
import { useCreateNewProject, useCreateNewModel } from '~~/lib/graphql/composables'
import { useAccountStore } from '~~/store/accounts'
import { useHostAppStore } from '~~/store/hostApp'
import { ISenderModelCard } from 'lib/bindings/definitions/IBasicConnectorBinding'
import { ISendFilter } from '~~/lib/bindings/definitions/ISendBinding'
import { nanoid } from 'nanoid'

const { addModel } = useHostAppStore()
const router = useRouter()
const { defaultAccount } = storeToRefs(useAccountStore())

const selectionStore = useSelectionStore()
const { selectionInfo } = storeToRefs(selectionStore)

const step = ref(0)
const hasSelectedSomethingNow = ref(false)

const selectionFilterCopy = ref<SelectionInfo>()
const modelName = ref('')
const projectName = ref('')

watch(selectionInfo, (newVal) => {
  hasSelectedSomethingNow.value = newVal?.selectedObjectIds?.length !== 0
})

const saveSelectionAndNext = () => {
  selectionFilterCopy.value = { ...selectionInfo.value }
  step.value++
}

const createProject = useCreateNewProject() // defaults to using default account is none is provided
const createModel = useCreateNewModel() // defaults to using default account is none is provided

const publish = async () => {
  const projectRes = await createProject({ name: projectName.value })
  const modelRes = await createModel({
    name: modelName.value,
    projectId: projectRes.data?.projectMutations.create.id as string
  })

  const sendFilter = {
    name: 'Selection',
    typeDiscriminator: 'RhinoSelectionFilter',
    ...selectionFilterCopy.value
  }

  const modelCard: ISenderModelCard = {
    typeDiscriminator: 'SenderModelCard',
    id: nanoid(),
    modelId: modelRes.data?.modelMutations.create.id as string,
    projectId: projectRes.data?.projectMutations.create.id as string,
    accountId: defaultAccount.value.accountInfo.id,
    sendFilter: sendFilter as ISendFilter
  }

  await addModel(modelCard)
  router.push('/')
  // TODO:
  // 0. create project & create model x
  // 1. create model sender card with selection info above x
  // 2. go to home page where this is displayed x
  // 3. send, and show progress
}
</script>
