<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
      ></HeaderNavLink>
      <HeaderNavLink
        v-if="props.project.model"
        :to="modelVersionsRoute(project.id, props.project.model.id)"
        :name="props.project.model.name"
      ></HeaderNavLink>
    </Portal>

    <CommonEditableTitleDescription
      :title="titleState"
      :description="descriptionState"
      :can-edit="canEdit"
      :is-disabled="anyMutationsLoading"
      @update:title="handleUpdateTitle"
      @update:description="handleUpdateDescription"
    />
  </div>
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
    id: props.project.model.id,
    description:
      props.project.model.description !== newDescription ? newDescription : null,
    name: props.project.model.name !== newTitle ? newTitle : null
  }
})

const anythingToUpdate = computed(() => {
  const updates = omit(currentUpdate.value, ['id'])
  return Object.values(updates).some((u) => !isNullOrUndefined(u))
})

const resetTitle = () => (titleState.value = props.project.model.name || '')
const resetDescription = () =>
  (descriptionState.value = props.project.model.description || '')
const resetInputs = () => {
  resetTitle()
  resetDescription()
}

watch(
  () => props.project.model.description,
  () => {
    resetDescription()
  },
  { immediate: true }
)

watch(
  () => props.project.model.name,
  () => {
    resetTitle()
  },
  { immediate: true }
)

const save = async () => {
  if (!anythingToUpdate.value || anyMutationsLoading.value) return
  const update = currentUpdate.value

  mp.track('Branch Action', {
    type: 'action',
    name: 'update',
    action: 'name or description',
    source: 'header'
  })

  const res = await updateModel({
    projectId: props.project.id,
    id: props.project.model.id,
    name: update.name || props.project.model.name,
    description: update.description || props.project.model.description
  })

  if (res?.id) {
    resetInputs()
  }
}

const handleUpdateTitle = (newTitle: string) => {
  titleState.value = newTitle
  save()
}

const handleUpdateDescription = (newDescription: string) => {
  descriptionState.value = newDescription
  save()
}
</script>
