<template>
  <Portal to="navigation">
    <HeaderNavLink :to="projectRoute(project.id)" :name="project.name"></HeaderNavLink>
    <HeaderNavLink
      v-if="model"
      :to="modelVersionsRoute(project.id, model.id)"
      :name="model.name"
    ></HeaderNavLink>
  </Portal>

  <CommonEditableTitleDescription
    :initial-title="titleState"
    :initial-description="descriptionState"
    :can-edit="canEdit"
    :is-disabled="anyMutationsLoading"
    @new-title="handleNewTitle"
    @new-description="handleNewDescription"
  />
</template>

<script setup lang="ts">
import { graphql } from '~~/lib/common/generated/gql'
import type {
  ProjectModelPageHeaderProjectFragment,
  UpdateModelInput
} from '~~/lib/common/generated/gql/graphql'
import { projectRoute, modelVersionsRoute } from '~~/lib/common/helpers/route'
import { omit, trim } from 'lodash-es'
import { isNullOrUndefined } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMutationLoading } from '@vue/apollo-composable'
import { useUpdateModel } from '~~/lib/projects/composables/modelManagement'
import { canEditProject } from '~~/lib/projects/helpers/permissions'

graphql(`
  fragment ProjectModelPageHeaderProject on Project {
    id
    name
    role
    model(id: $modelId) {
      id
      name
      description
    }
  }
`)

const props = defineProps<{
  project: ProjectModelPageHeaderProjectFragment
}>()

const model = computed(() => props.project.model)

const mp = useMixpanel()
const anyMutationsLoading = useMutationLoading()
const updateModel = useUpdateModel()

const descriptionState = ref('')
const titleState = ref('')

const canEdit = computed(() => canEditProject(props.project))

const currentUpdate = computed((): UpdateModelInput => {
  const newDescription = trim(descriptionState.value)
  const newTitle = trim(titleState.value)

  return {
    projectId: props.project.id,
    id: model.value.id,
    description: model.value.description !== newDescription ? newDescription : null,
    name: model.value.name !== newTitle ? newTitle : null
  }
})

const anythingToUpdate = computed(() => {
  const updates = omit(currentUpdate.value, ['id'])
  return Object.values(updates).some((u) => !isNullOrUndefined(u))
})

const resetTitle = () => (titleState.value = model.value.name || '')
const resetDescription = () => (descriptionState.value = model.value.description || '')
const resetInputs = () => {
  resetTitle()
  resetDescription()
}

watch(
  () => model.value.description,
  () => {
    resetDescription()
  },
  { immediate: true }
)

watch(
  () => model.value.name,
  () => {
    resetTitle()
  },
  { immediate: true }
)

const save = async () => {
  if (!anythingToUpdate.value || anyMutationsLoading.value) return
  const update = currentUpdate.value

  mp.track('Stream Action', {
    type: 'action',
    name: 'update',
    action: 'name or description',
    source: 'header'
  })

  const res = await updateModel({
    projectId: props.project.id,
    id: model.value.id,
    name: update.name || model.value.name,
    description: update.description || props.project.model.description
  })

  if (res?.id) {
    resetInputs()
  }
}

const handleNewTitle = (newTitle: string) => {
  titleState.value = newTitle
  save()
}

const handleNewDescription = (newDescription: string) => {
  descriptionState.value = newDescription
  save()
}
</script>
