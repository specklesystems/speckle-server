<template>
  <div class="rounded-md" :class="[containerClasses, textClasses]">
    <div class="flex" :class="[hasDescription ? '' : 'items-center space-x-2']">
      <div class="flex-shrink-0">
        <CheckCircleIcon class="h-5 w-5" :class="iconClasses" aria-hidden="true" />
      </div>
      <div
        class="ml-3 grow"
        :class="[hasDescription ? '' : 'flex items-center space-x-2']"
      >
        <h3 class="text-sm" :class="[hasDescription ? 'font-medium' : '']">
          <slot name="title">Title</slot>
        </h3>
        <div v-if="hasDescription" class="mt-2 text-sm">
          <slot name="description">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aliquid pariatur,
            ipsum similique veniam.
          </slot>
        </div>
        <div :class="[hasDescription ? (actions?.length ? 'mt-4' : '') : 'grow flex']">
          <div
            class="flex"
            :class="['space-x-2', hasDescription ? '' : 'grow justify-end']"
          >
            <FormButton
              v-for="(action, i) in actions || []"
              :key="i"
              :color="color"
              size="sm"
              :to="action.url"
              :external="action.externalUrl || false"
              @click="action.onClick || noop"
            >
              {{ action.title }}
            </FormButton>
          </div>
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
import { CheckCircleIcon, XMarkIcon } from '@heroicons/vue/20/solid'
import { noop } from 'lodash'
import { computed, useSlots } from 'vue'
import FormButton from '~~/src/components/form/Button.vue'

type AlertColor = 'success' | 'danger' | 'warning' | 'info'

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
  }>(),
  {
    color: 'success'
  }
)

const slots = useSlots()
const hasDescription = computed(() => !!slots['description'])

const containerClasses = computed(() => {
  const classParts: string[] = []

  classParts.push(hasDescription.value ? 'p-4' : 'p-2')

  switch (props.color) {
    case 'success':
      classParts.push('bg-success-lighter border-l-4 border-success')
      break
    case 'info':
      classParts.push('bg-info-lighter border-l-4 border-info')
      break
    case 'danger':
      classParts.push('bg-danger-lighter border-l-4 border-danger')
      break
    case 'warning':
      classParts.push('bg-warning-lighter border-l-4 border-warning')
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
</script>
