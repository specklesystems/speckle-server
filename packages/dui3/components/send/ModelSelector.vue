<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div class="space-y-2">
    <div class="space-y-2">
      <div
        class="flex items-center space-x-2 justify-between items-center items-centre"
      >
        <FormTextInput
          v-model="modelName"
          placeholder="search"
          name="search"
          :show-clear="!!modelName"
          full-width
        />
      </div>
      <div class="relative grid grid-cols-1 gap-2">
        <CommonLoadingBar v-if="loading" loading />
        <div
          v-for="model in models"
          :key="model.id"
          class="group relative bg-foundation-2 rounded p-2 hover:text-primary hover:bg-primary-muted transition cursor-pointer hover:shadow-md"
          @click="$emit('next', model)"
        >
          <div class="flex items-center space-x-4">
            <div>
              <img
                v-if="model.previewUrl"
                :src="model.previewUrl"
                alt="preview image for model"
                class="h-12 w-12 object-cover"
              />
              <div
                v-else
                class="h-12 w-12 bg-blue-500/10 rounded flex items-center justify-center"
              >
                <CubeTransparentIcon class="w-5 h-5 text-foreground-2" />
              </div>
            </div>
            <div class="min-w-0">
              <div class="caption text-foreground-2">
                {{ model.name }}
              </div>
              <div class="font-bold">{{ model.displayName }}</div>
              <div class="caption text-foreground-2 truncate">
                {{ new Date(model.updatedAt).toLocaleString() }}
                | {{ model.versions.totalCount }} versions
              </div>
              <div
                class="absolute top-6 caption right-3 opacity-0 transition group-hover:opacity-100 rounded-md bg-primary text-foreground-on-primary p-1"
              >
                select
              </div>
            </div>
          </div>
        </div>
        <div class="caption text-center mt-2">{{ totalCount }} model(s) found.</div>
      </div>
    </div>
    <button
      v-if="showNewModel"
      v-tippy="'Create A New Model'"
      class="fixed bottom-2 flex items-center justify-center right-2 z-100 w-12 h-12 rounded-full bg-primary text-foreground-on-primary"
      @click="showNewModelDialog = true"
    >
      <PlusIcon class="w-6 h-6" />
    </button>
    <LayoutDialog v-model:open="showNewModelDialog" hide-closer>
      <div class="-mx-6 -my-5 space-y-2">
        <form @submit="onSubmit">
          <FormTextInput
            v-model="newModelName"
            :rules="rules"
            placeholder="new model name"
            name="new model name"
            :show-clear="!!newModelName"
            full-width
          />
          <div class="mt-2 flex">
            <FormButton text @click="showNewModelDialog = false">Cancel</FormButton>
            <FormButton class="flex-grow" submit>Create</FormButton>
          </div>
        </form>
      </div>
    </LayoutDialog>
  </div>
</template>
<script setup lang="ts">
import { CubeTransparentIcon, PlusIcon } from '@heroicons/vue/20/solid'
import { useQuery } from '@vue/apollo-composable'
import {
  ProjectListProjectItemFragment,
  ModelListModelItemFragment
} from '~/lib/common/generated/gql/graphql'
import { useModelNameValidationRules } from '~/lib/validation'
import { projectModelsQuery } from '~/lib/graphql/mutationsAndQueries'
import { useForm } from 'vee-validate'

defineEmits<{
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

const showNewModelDialog = ref(false)

const modelName = ref<string>()
const newModelName = ref<string>()

const rules = useModelNameValidationRules()

const { handleSubmit } = useForm<{ name: string }>()
const onSubmit = handleSubmit(async ({ name }) => {
  // await createModel({ name, projectId: props.projectId })
  // mp.track('Branch Action', { type: 'action', name: 'create', mode: 'dialog' })
  // openState.value = false
})

const { result: projectModelsResult, loading } = useQuery(
  projectModelsQuery,
  () => ({
    projectId: props.project.id,
    limit: 5,
    filter: {
      search: (modelName.value || '').trim() || null
    }
  }),
  () => ({ clientId: props.accountId, debounce: 500 })
)

const models = computed(() => projectModelsResult.value?.project.models.items)
const totalCount = computed(() => projectModelsResult.value?.project.models.totalCount)
</script>
