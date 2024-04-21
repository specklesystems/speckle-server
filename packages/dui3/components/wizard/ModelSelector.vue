<template>
  <div class="space-y-2">
    <div class="space-y-2">
      <div
        class="flex items-center space-x-2 justify-between sticky top-4 bg-foundation z-10 py-4 border-b"
      >
        <FormTextInput
          v-model="modelName"
          :placeholder="
            totalCount === 0 ? 'New model name' : 'Search models in ' + project.name
          "
          name="search"
          autocomplete="off"
          :show-clear="!!modelName"
          full-width
          size="lg"
        />
      </div>
      <div class="relative grid grid-cols-1 gap-2">
        <CommonLoadingBar v-if="loading" loading />
        <WizardListModelCard
          v-for="model in models"
          :key="model.id"
          :model="model"
          @click="$emit('next', model)"
        />
        <div class="caption text-center mt-2">{{ totalCount }} model(s) found.</div>
        <div v-if="showNewModel && totalCount === 0 && modelName">
          <FormButton
            full-width
            class="block truncate max-w-full overflow-hidden"
            @click="createNewModel(modelName)"
          >
            Create "{{ modelName }}"
          </FormButton>
        </div>
      </div>
    </div>
    <button
      v-if="showNewModel && totalCount !== 0"
      v-tippy="'Create A New Model'"
      class="fixed bottom-2 flex items-center justify-center right-2 z-100 w-12 h-12 rounded-full bg-primary text-foreground-on-primary"
      @click="showNewModelDialog = true"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
    <LayoutDialog v-model:open="showNewModelDialog" title="Create new model">
      <form @submit="onSubmit">
        <FormTextInput
          v-model="newModelName"
          :rules="rules"
          placeholder="West facade, Level 1 layout..."
          name="name"
          :show-clear="!!newModelName"
          full-width
          autocomplete="off"
          size="lg"
        />
        <div class="mt-4 flex">
          <FormButton class="flex-grow" text @click="showNewModelDialog = false">
            Cancel
          </FormButton>
          <FormButton class="flex-grow" submit>Create</FormButton>
        </div>
      </form>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { PlusIcon } from '@heroicons/vue/20/solid'
import { provideApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import {
  ProjectListProjectItemFragment,
  ModelListModelItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useModelNameValidationRules } from '~/lib/validation'
import {
  createModelMutation,
  projectModelsQuery
} from '~/lib/graphql/mutationsAndQueries'
import { useForm } from 'vee-validate'
import { DUIAccount, useAccountStore } from '~/store/accounts'
import { watchOnce } from '@vueuse/core'

const emit = defineEmits<{
  (e: 'next', model: ModelListModelItemFragment): void
}>()

const props = withDefaults(
  defineProps<{
    project: ProjectListProjectItemFragment
    accountId: string
    showNewModel?: boolean
  }>(),
  { showNewModel: true }
)

const accountStore = useAccountStore()

const showNewModelDialog = ref(false)

const modelName = ref<string>()
const newModelName = ref<string>()

const rules = useModelNameValidationRules()

const { handleSubmit } = useForm<{ name: string }>()
const onSubmit = handleSubmit((args) => {
  void createNewModel(args.name)
})

const createNewModel = async (name: string) => {
  const account = accountStore.accounts.find(
    (acc) => acc.accountInfo.id === props.accountId
  ) as DUIAccount

  const { mutate } = provideApolloClient(account.client)(() =>
    useMutation(createModelMutation)
  )
  const res = await mutate({ input: { projectId: props.project.id, name } })

  if (res?.data?.modelMutations.create) {
    emit('next', res?.data?.modelMutations.create)
  } else {
    // TODO: Error out
  }
}

const { result: projectModelsResult, loading } = useQuery(
  projectModelsQuery,
  () => ({
    projectId: props.project.id,
    limit: 10,
    filter: {
      search: (modelName.value || '').trim() || null
    }
  }),
  () => ({ clientId: props.accountId, debounce: 500, fetchPolicy: 'cache-and-network' })
)

const models = computed(() => projectModelsResult.value?.project.models.items)
const totalCount = computed(() => projectModelsResult.value?.project.models.totalCount)
const initialCount = ref(-1)

watchOnce(projectModelsResult, (newObj) => {
  console.log(newObj?.project.models.totalCount)
  if (newObj?.project.models.totalCount)
    initialCount.value = newObj.project.models.totalCount
})
</script>
