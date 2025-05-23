<template>
  <CommonAlert
    v-if="variant === 'alert'"
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
  <div v-else class="flex flex-col space-y-1">
    <div class="text-body-3xs text-foreground-2 pr-8 select-none">
      {{ text }}
    </div>
    <FormButton color="outline" size="sm" @click="actions[0].onClick">
      {{ actions[0].title }}
    </FormButton>
  </div>
</template>
<script setup lang="ts">
import type { AlertAction } from '@speckle/ui-components'
import type {
  ViewerLimitAlertType,
  ViewerLimitAlertVariant
} from '~/lib/common/helpers/permissions'

const props = withDefaults(
  defineProps<{
    limitType: ViewerLimitAlertType
    variant?: ViewerLimitAlertVariant
  }>(),
  {
    variant: 'alert'
  }
)

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

const onClick = noop
</script>
