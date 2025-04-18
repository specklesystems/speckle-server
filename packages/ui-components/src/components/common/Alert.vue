<template>
  <div :class="containerClasses">
    <div :class="subcontainerClasses">
      <div v-if="!hideIcon">
        <Component :is="icon" :class="iconClasses" aria-hidden="true" />
      </div>
      <div class="flex-1">
        <h3 v-if="hasTitle" :class="titleClasses">
          <slot name="title">Title</slot>
        </h3>
        <div v-if="hasDescription" :class="descriptionClasses">
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
import { computed, useSlots, type SetupContext } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import type {
  PropAnyComponent,
  AlertAction,
  AlertColor
} from '~~/src/helpers/common/components'

type Size = 'default' | 'xs' | '2xs'

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

const slots: SetupContext['slots'] = useSlots()
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
      return CheckCircleIcon
    default:
      return InformationCircleIcon
  }
})

const containerClasses = computed(() => {
  const classParts: string[] = ['rounded-lg text-foreground border']

  switch (props.size) {
    case '2xs':
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
      classParts.push('bg-success-lightest border-outline-2')
      break
    case 'info':
      classParts.push('bg-foundation-2 border-outline-3')
      break
    case 'danger':
      classParts.push('bg-danger-lightest border-outline-2')
      break
    case 'warning':
      classParts.push('bg-warning-lightest border-outline-2')
      break
    case 'neutral':
      classParts.push('bg-foundation border-outline-2')
      break
  }

  return classParts.join(' ')
})

const subcontainerClasses = computed(() => {
  const classParts: string[] = ['flex items-center w-full']

  switch (props.size) {
    case '2xs':
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
    case '2xs':
      classParts.push('h-4 w-4')
      break
    case 'xs':
      classParts.push('h-5 w-5')
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
      classParts.push('text-info-darker dark:text-primary')
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

const titleClasses = computed(() => {
  const classParts: string[] = ['font-medium']

  switch (props.size) {
    case '2xs':
      classParts.push('text-body-2xs')
      break
    case 'default':
    default:
      classParts.push('text-body-xs')
      break
  }

  return classParts.join(' ')
})

const descriptionClasses = computed(() => {
  const classParts: string[] = ['whitespace-normal']

  switch (props.size) {
    case '2xs':
      classParts.push('text-body-2xs pt-0.5')
      break
    case 'default':
    default:
      classParts.push('text-body-xs')
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
