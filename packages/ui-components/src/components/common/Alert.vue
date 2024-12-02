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
          @click="action.onClick || noop"
        >
          {{ action.title }}
        </FormButton>
      </div>
      <div
        v-if="withDismiss"
        class="flex"
        :class="[hasDescription ? 'items-start' : 'items-center']"
      >
        <FormButton
          type="button"
          class="inline-flex rounded-md focus:outline-none focus:ring-2"
          :class="buttonClasses"
          color="subtle"
          size="sm"
          @click="$emit('dismiss')"
        >
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
import type { PropAnyComponent } from '~~/src/helpers/common/components'
import type { AlertAction } from '~~/src/helpers/layout/components'

type AlertColor = 'success' | 'danger' | 'warning' | 'info'
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
  const classParts: string[] = ['rounded-md text-foreground']

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
      classParts.push(
        `bg-success-lightest ${!props.hideIcon && 'border border-success-darker'}`
      )
      break
    case 'info':
      classParts.push(
        `bg-info-lightest ${!props.hideIcon && 'border border-info-darker'}`
      )
      break
    case 'danger':
      classParts.push(
        `bg-danger-lightest ${!props.hideIcon && 'border border-danger-darker'}`
      )
      break
    case 'warning':
      classParts.push(
        `bg-warning-lightest ${!props.hideIcon && 'border border-warning-darker'}`
      )
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
      classParts.push('gap-x-2')
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
  }

  return classParts.join(' ')
})

const buttonClasses = computed(() => {
  const classParts: string[] = []

  switch (props.color) {
    case 'success':
      classParts.push('bg-success-lighter ring-success')
      break
    case 'info':
      classParts.push('bg-info-lighter ring-info')
      break
    case 'danger':
      classParts.push('bg-danger-lighter ring-danger')
      break
    case 'warning':
      classParts.push('bg-warning-lighter ring-warning')
      break
  }

  return classParts.join(' ')
})
</script>
