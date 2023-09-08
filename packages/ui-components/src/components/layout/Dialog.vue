<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-40" @close="onClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-neutral-100/70 dark:bg-neutral-900/70 transition-opacity"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div class="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            @after-leave="$emit('fully-closed')"
          >
            <DialogPanel
              :class="[
                'transform rounded-lg bg-foundation text-left shadow-xl transition-all',
                widthClasses
              ]"
              :as="isForm ? 'form' : 'div'"
              @submit.prevent="onSubmit"
            >
              <div
                v-if="title"
                class="flex items-center justify-center shadow p-4 relative z-10 bg-foundation rounded-t-lg"
              >
                <h4 class="text-2xl font-bold">{{ title }}</h4>
              </div>
              <button
                v-if="!hideCloser"
                class="absolute z-20 top-5 right-4 text-foreground"
                @click="open = false"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
              <div class="p-4 sm:p-6">
                <slot>Put your content here!</slot>
              </div>
              <div
                v-if="hasButtons"
                class="flex p-4 sm:px-6 sm:py-5 border-t gap-2 border-outline-3"
              >
                <template v-if="buttons">
                  <FormButton
                    v-for="(button, index) in buttons"
                    :key="index"
                    v-bind="button.props"
                    @click="button.onClick"
                  >
                    {{ button.text }}
                  </FormButton>
                </template>
                <template v-else>
                  <slot name="buttons" />
                </template>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>
<script setup lang="ts">
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { FormButton } from '~~/src/lib'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { computed, useSlots } from 'vue'

type MaxWidthValue = 'sm' | 'md' | 'lg' | 'xl'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'fully-closed'): void
}>()

const props = defineProps<{
  open: boolean
  maxWidth?: MaxWidthValue
  hideCloser?: boolean
  /**
   * Prevent modal from closing when the user clicks outside of the modal or presses Esc
   */
  preventCloseOnClickOutside?: boolean
  title?: string
  buttons?: Array<{
    text: string
    props: Record<string, unknown>
    onClick?: () => void
  }>
  /**
   * If set, the modal will be wrapped in a form element and the `onSubmit` callback will be invoked when the user submits the form
   */
  onSubmit?: (e: SubmitEvent) => void
}>()

const slots = useSlots()

const isForm = computed(() => !!props.onSubmit)
const hasButtons = computed(() => props.buttons || slots.buttons)

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const maxWidthWeight = computed(() => {
  switch (props.maxWidth) {
    case 'sm':
      return 0
    case 'md':
      return 1
    case 'lg':
      return 2
    case 'xl':
      return 3
    default:
      return 10000
  }
})

const widthClasses = computed(() => {
  const classParts: string[] = ['w-full', 'sm:my-8 sm:w-full sm:max-w-xl']

  if (!props.title && !hasButtons.value) {
    classParts.push('px-4 pt-4 pb-4', 'sm:p-6')
  }

  if (maxWidthWeight.value >= 1) {
    classParts.push('md:max-w-2xl')
  }

  if (maxWidthWeight.value >= 2) {
    classParts.push('lg:max-w-4xl')
  }

  if (maxWidthWeight.value >= 3) {
    classParts.push('xl:max-w-6xl')
  }

  if (maxWidthWeight.value >= 4) {
    classParts.push('2xl:max-w-7xl')
  }

  return classParts.join(' ')
})

const onClose = () => {
  if (props.preventCloseOnClickOutside) return
  open.value = false
}
</script>
