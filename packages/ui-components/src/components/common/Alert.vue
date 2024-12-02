<template>
  <div :class="containerClasses">
    <div :class="subcontainerClasses">
      <div v-if="!hideIcon">
        <Component :is="icon" :class="iconClasses" aria-hidden="true" />
      </div>
      <div class="flex-1">
        <h3 v-if="hasTitle" class="text-body-xs font-medium">
          <slot name="title">Title</slot>
        </h3>
        <div v-if="hasDescription" class="text-body-xs">
          <slot name="description">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur,
            ipsum similique veniam.
          </slot>
        </div>
      </div>
      <div class="flex gap-x-2">
        <FormButton
          v-for="(action, i) in actions || []"
          :key="i"
          color="outline"
          size="sm"
          :to="action.url"
          :external="action.externalUrl || false"
          :disabled="action.disabled || false"
          @click="handleActionClick(action)"
        >
          {{ action.title }}
        </FormButton>
      </div>
      <div
        v-if="withDismiss"
        class="flex"
        :class="[hasDescription ? 'items-start' : 'items-center']"
      >
        <FormButton type="button" color="subtle" size="sm" @click="$emit('dismiss')">
          Dismiss
        </FormButton>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'
import { noop } from 'lodash'
import { computed, useSlots } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import type {
  PropAnyComponent,
  AlertAction,
  AlertColor
} from '~~/src/helpers/common/components'

type Size = 'default' | 'xs'

defineEmits<{ (e: 'dismiss'): void }>()

const props = withDefaults(
  defineProps<{
    color?: AlertColor
    withDismiss?: boolean
    actions?: Array<AlertAction>
    customIcon?: PropAnyComponent
    hideIcon?: boolean
    size?: Size
  }>(),
  {
    color: 'success',
    size: 'default'
  }
)

const slots = useSlots()
const hasDescription = computed(() => !!slots['description'])
const hasTitle = computed(() => !!slots['title'])

const icon = computed(() => {
  if (props.customIcon) return props.customIcon

  switch (props.color) {
    case 'info':
      return InformationCircleIcon
    case 'warning':
      return ExclamationCircleIcon
    case 'danger':
      return XCircleIcon
    case 'success':
    default:
      return CheckCircleIcon
  }
})

const containerClasses = computed(() => {
  const classParts: string[] = ['rounded-lg text-foreground border border-outline-2']

  switch (props.size) {
    case 'xs':
      classParts.push('p-2')
      break
    case 'default':
    default:
      classParts.push(hasDescription.value ? 'p-3 sm:p-4' : 'p-2')
      break
  }

  switch (props.color) {
    case 'success':
      classParts.push('bg-success-lightest')
      break
    case 'info':
      classParts.push('bg-info-lightest')
      break
    case 'danger':
      classParts.push('bg-danger-lightest')
      break
    case 'warning':
      classParts.push('bg-warning-lightest')
      break
    case 'neutral':
      classParts.push('bg-foundation')
      break
  }

  return classParts.join(' ')
})

const subcontainerClasses = computed(() => {
  const classParts: string[] = ['flex items-center w-full']

  switch (props.size) {
    case 'xs':
      classParts.push('gap-x-1.5')
      break
    case 'default':
    default:
      classParts.push('gap-x-3')
      break
  }

  return classParts.join(' ')
})

const iconClasses = computed(() => {
  const classParts: string[] = []

  switch (props.size) {
    case 'xs':
      classParts.push('h-5 w-5')
      classParts.push(hasDescription.value ? 'mt-0.5' : '')
      break
    case 'default':
    default:
      classParts.push('h-6 w-6')
      break
  }

  switch (props.color) {
    case 'success':
      classParts.push('text-success-darker')
      break
    case 'info':
      classParts.push('text-info-darker')
      break
    case 'danger':
      classParts.push('text-danger-darker')
      break
    case 'warning':
      classParts.push('text-warning-darker')
      break
    case 'neutral':
      classParts.push('text-foreground-2')
      break
  }

  return classParts.join(' ')
})

function handleActionClick(action: AlertAction) {
  if (action.onClick) {
    action.onClick()
  } else {
    noop()
  }
}
</script>
