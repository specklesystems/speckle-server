<template>
  <div class="rounded-md" :class="[containerClasses, textClasses]">
    <div class="flex" :class="subcontainerClasses">
      <div v-if="!hideIcon" class="flex-shrink-0">
        <Component :is="icon" :class="iconClasses" aria-hidden="true" />
      </div>
      <div :class="mainContentContainerClasses">
        <h3 v-if="hasTitle" class="text-sm" :class="{ 'font-medium': hasDescription }">
          <slot name="title">Title</slot>
        </h3>
        <div v-if="hasDescription" :class="descriptionWrapperClasses">
          <slot name="description">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur,
            ipsum similique veniam.
          </slot>
        </div>
        <div :class="actionsContainerClasses">
          <FormButton
            v-for="(action, i) in actions || []"
            :key="i"
            :color="color"
            :size="actionSize"
            :to="action.url"
            :external="action.externalUrl || false"
            @click="action.onClick || noop"
          >
            {{ action.title }}
          </FormButton>
        </div>
      </div>
      <div
        v-if="withDismiss"
        class="flex"
        :class="[hasDescription ? 'items-start' : 'items-center']"
      >
        <button
          type="button"
          class="inline-flex rounded-md focus:outline-none focus:ring-2"
          :class="buttonClasses"
          @click="$emit('dismiss')"
        >
          <span class="sr-only">Dismiss</span>
          <XMarkIcon class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  CheckCircleIcon,
  XMarkIcon,
  XCircleIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/20/solid'
import { noop } from 'lodash'
import { computed, useSlots } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'
import type { PropAnyComponent } from '~~/src/helpers/common/components'

type AlertColor = 'success' | 'danger' | 'warning' | 'info'
type Size = 'default' | 'xs'

defineEmits<{ (e: 'dismiss'): void }>()

const props = withDefaults(
  defineProps<{
    color?: AlertColor
    withDismiss?: boolean
    actions?: Array<{
      title: string
      url?: string
      onClick?: () => void
      externalUrl?: boolean
    }>
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
  const classParts: string[] = []

  switch (props.size) {
    case 'xs':
      classParts.push('p-1')
      break
    case 'default':
    default:
      classParts.push(hasDescription.value ? 'p-3 sm:p-4' : 'p-2')
      break
  }

  switch (props.color) {
    case 'success':
      classParts.push(
        `bg-success-lighter ${!props.hideIcon && 'border-l-4 border-success'}`
      )
      break
    case 'info':
      classParts.push(`bg-info-lighter ${!props.hideIcon && 'border-l-4 border-info'}`)
      break
    case 'danger':
      classParts.push(
        `bg-danger-lighter ${!props.hideIcon && 'border-l-4 border-danger'}`
      )
      break
    case 'warning':
      classParts.push(
        `bg-warning-lighter ${!props.hideIcon && 'border-l-4 border-warning'}`
      )
      break
  }

  return classParts.join(' ')
})

const subcontainerClasses = computed(() => {
  const classParts: string[] = []

  if (hasDescription.value) {
    classParts.push('')
  } else {
    classParts.push('items-center')

    switch (props.size) {
      case 'xs':
        classParts.push('space-x-1')
        break
      case 'default':
      default:
        classParts.push('space-x-2')
        break
    }
  }

  return classParts.join(' ')
})

const mainContentContainerClasses = computed(() => {
  const classParts: string[] = ['grow']

  if (!hasDescription.value) {
    classParts.push('flex items-center space-x-2')
  }

  switch (props.size) {
    case 'xs':
      classParts.push('ml-1')
      break
    case 'default':
    default:
      classParts.push('ml-3')

      break
  }

  return classParts.join(' ')
})

const descriptionWrapperClasses = computed(() => {
  const classParts: string[] = []

  switch (props.size) {
    case 'xs':
      classParts.push('text-xs')
      break
    case 'default':
    default:
      classParts.push('text-xs sm:text-sm')
      break
  }

  if (hasTitle.value && props.size !== 'xs') {
    classParts.push('mt-1 sm:mt-2')
  }

  return classParts.join(' ')
})

const actionsContainerClasses = computed(() => {
  const classParts: string[] = ['flex']

  if (!hasDescription.value) {
    classParts.push('grow justify-end')
  }

  const hasDescriptionAndActions = hasDescription.value && props.actions?.length

  switch (props.size) {
    case 'xs':
      classParts.push('space-x-1')
      if (hasDescriptionAndActions) {
        classParts.push('mt-1')
      }
      break
    case 'default':
    default:
      classParts.push('space-x-2')
      if (hasDescriptionAndActions) {
        classParts.push('mt-4')
      }
      break
  }

  return classParts.join(' ')
})

const textClasses = computed(() => {
  const classParts: string[] = []

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

const iconClasses = computed(() => {
  const classParts: string[] = []

  switch (props.size) {
    case 'xs':
      classParts.push('h-4 w-4')
      classParts.push(hasDescription.value ? 'mt-0.5' : '')
      break
    case 'default':
    default:
      classParts.push('h-5 w-5')
      break
  }

  switch (props.color) {
    case 'success':
      classParts.push('text-success')
      break
    case 'info':
      classParts.push('text-info')
      break
    case 'danger':
      classParts.push('text-danger')
      break
    case 'warning':
      classParts.push('text-warning')
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

const actionSize = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'small'
    case 'default':
    default:
      return 'base'
  }
})
</script>
