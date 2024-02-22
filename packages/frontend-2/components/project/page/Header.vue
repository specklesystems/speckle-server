<template>
  <div>
    <Portal to="navigation">
      <HeaderNavLink
        :to="projectRoute(project.id)"
        :name="project.name"
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
  ProjectPageProjectHeaderFragment,
  ProjectUpdateInput
} from '~~/lib/common/generated/gql/graphql'
import { projectRoute } from '~~/lib/common/helpers/route'
import { omit, trim } from 'lodash-es'
import { isNullOrUndefined } from '@speckle/shared'
import { useMixpanel } from '~~/lib/core/composables/mp'
import { useMutationLoading } from '@vue/apollo-composable'
import { useUpdateProject } from '~~/lib/projects/composables/projectManagement'
import { canEditProject } from '~~/lib/projects/helpers/permissions'

graphql(`
  fragment ProjectPageProjectHeader on Project {
    id
    role
    name
    description
    visibility
    allowPublicComments
  }
`)

const props = defineProps<{
  project: ProjectPageProjectHeaderFragment
}>()

const mp = useMixpanel()
const anyMutationsLoading = useMutationLoading()
const updateProject = useUpdateProject()

const descriptionState = ref('')
const titleState = ref('')

const canEdit = computed(() => canEditProject(props.project))

const currentUpdate = computed((): ProjectUpdateInput => {
  const project = props.project
  const newDescription = trim(descriptionState.value)
  const newTitle = trim(titleState.value)

  return {
    id: project.id,
    description: project.description !== newDescription ? newDescription : null,
    name: project.name !== newTitle ? newTitle : null
  }
})

const anythingToUpdate = computed(() => {
  const updates = omit(currentUpdate.value, ['id'])
  return Object.values(updates).some((u) => !isNullOrUndefined(u))
})

const resetTitle = () => (titleState.value = props.project.name || '')
const resetDescription = () =>
  (descriptionState.value = props.project.description || '')
const resetInputs = () => {
  resetTitle()
  resetDescription()
}

watch(
  () => props.project.description,
  () => {
    resetDescription()
  },
  { immediate: true }
)

watch(
  () => props.project.name,
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
  const res = await updateProject(update, {
    optimisticResponse: {
      projectMutations: {
        __typename: 'ProjectMutations',
        update: {
          __typename: 'Project',
          ...props.project,
          name: update.name || props.project.name,
          description:
            update.description !== null ? update.description : props.project.description
        }
      }
    }
  })

  if (res?.id) resetInputs()
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
