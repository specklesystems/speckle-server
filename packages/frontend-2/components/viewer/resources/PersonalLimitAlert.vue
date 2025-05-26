<template>
  <div>
    <CommonAlert
      v-if="variant === 'alert'"
      v-bind="$attrs"
      class="select-none"
      size="2xs"
      color="info"
      hide-icon
      :actions="actions"
    >
      <template #description>
        {{ text }}
      </template>
    </CommonAlert>
    <div v-else class="flex flex-col space-y-1" v-bind="$attrs">
      <div class="text-body-3xs text-foreground-2 pr-8 select-none">
        {{ text }}
      </div>
      <FormButton color="outline" size="sm" @click="actions[0].onClick">
        {{ actions[0].title }}
      </FormButton>
    </div>
    <WorkspaceMoveProject
      v-model:open="showMoveDialog"
      :project="project"
      location="personal_limit_alert"
      show-intro
      @done="$emit('done')"
    />
  </div>
</template>
<script setup lang="ts">
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { AlertAction } from '@speckle/ui-components'
import { graphql } from '~/lib/common/generated/gql'
import type { ViewerResourcesPersonalLimitAlert_ProjectFragment } from '~/lib/common/generated/gql/graphql'
import type {
  ViewerLimitAlertType,
  ViewerLimitAlertVariant
} from '~/lib/common/helpers/permissions'

graphql(`
  fragment ViewerResourcesPersonalLimitAlert_Project on Project {
    id
    ...WorkspaceMoveProject_Project
  }
`)

defineEmits<{
  done: []
}>()

const props = withDefaults(
  defineProps<{
    project: MaybeNullOrUndefined<ViewerResourcesPersonalLimitAlert_ProjectFragment>
    limitType: ViewerLimitAlertType
    variant?: ViewerLimitAlertVariant
  }>(),
  {
    variant: 'alert'
  }
)

const showMoveDialog = ref(false)

const text = computed(() => {
  if (props.limitType === 'comment') {
    return `Comment locked`
  }

  return `Version locked`
})

const actions = computed((): AlertAction[] => [
  {
    title: 'Learn more',
    onClick
  }
])

const onClick = () => {
  showMoveDialog.value = true
}
</script>
