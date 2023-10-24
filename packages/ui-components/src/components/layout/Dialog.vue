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
          class="fixed inset-0 bg-neutral-100/70 dark:bg-neutral-900/70 transition-opacity backdrop-blur-xs"
        />
      </TransitionChild>

      <div class="fixed inset-0 z-10 h-screen w-screen">
        <div
          :class="
            sidePanel
              ? 'absolute top-0 right-0 h-screen w-96'
              : 'flex justify-center items-center h-full w-full p-4 sm:p-0'
          "
        >
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
                'transform text-foreground overflow-hidden bg-foundation text-left shadow-xl transition-all flex flex-col',
                widthClasses,
                sidePanel ? 'h-full' : 'max-h-[90vh] rounded-lg'
              ]"
              :as="isForm ? 'form' : 'div'"
              @submit.prevent="onSubmit"
            >
              <div :class="scrolledFromTop && 'relative z-10 shadow-lg'">
                <div
                  v-if="title"
                  class="flex items-center justify-start rounded-t-lg shrink-0 h-16 px-8"
                >
                  <h4 class="text-2xl font-bold">{{ title }}</h4>
                </div>
              </div>

              <button
                v-if="!hideCloser"
                class="absolute z-20 right-4 bg-foundation rounded-full p-1"
                :class="title ? 'top-4' : 'top-3'"
                @click="open = false"
              >
                <XMarkIcon class="h-6 w-6" />
              </button>
              <div
                class="flex-1 simple-scrollbar overflow-y-auto bg-white dark:bg-foundation"
                :class="title ? 'py-6 px-8' : 'p-10'"
                @scroll="onScroll"
              >
                <slot>Put your content here!</slot>
              </div>
              <div
                v-if="hasButtons"
                class="flex p-4 sm:px-6 gap-2 shrink-0"
                :class="!scrolledToBottom && 'shadow-t'"
              >
                <template v-if="buttons">
                  <FormButton
                    v-for="(button, index) in buttons"
                    :key="index"
                    v-bind="button.props"
                    :disabled="button.disabled"
                    :type="button.submit && 'submit'"
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
import { computed, ref, useSlots } from 'vue'
import { throttle } from 'lodash'

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
  sidePanel?: boolean
  buttons?: Array<{
    text: string
    props: Record<string, unknown>
    onClick?: () => void
    disabled?: boolean
    submit?: boolean
  }>
  /**
   * If set, the modal will be wrapped in a form element and the `onSubmit` callback will be invoked when the user submits the form
   */
  onSubmit?: (e: SubmitEvent) => void
}>()

const slots = useSlots()

const scrolledFromTop = ref(false)
const scrolledToBottom = ref(false)

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
  const classParts: string[] = ['w-full', 'sm:w-full sm:max-w-xl']

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

const onScroll = throttle((e: Event) => {
  const target = e.target as HTMLElement
  const { scrollTop, offsetHeight, scrollHeight } = target
  scrolledFromTop.value = scrollTop > 0
  scrolledToBottom.value = scrollTop + offsetHeight >= scrollHeight
}, 60)
</script>
