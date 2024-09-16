<template>
  <TransitionRoot as="template" :show="open">
    <Dialog as="div" class="relative z-50" @close="onClose">
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-400"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed top-0 left-0 w-full h-full backdrop-blur-xs bg-black/60 dark:bg-neutral-900/60 transition-opacity"
        />
      </TransitionChild>
      <div class="fixed top-0 left-0 z-10 h-screen !h-[100dvh] w-screen">
        <div
          class="flex md:justify-center h-full w-full md:p-6"
          :class="[
            fullscreen === 'none' || fullscreen === 'desktop'
              ? 'p-4 items-center'
              : 'items-end md:items-center'
          ]"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-5000"
            :enter-from="`md:opacity-0 ${
              fullscreen === 'mobile' || fullscreen === 'all'
                ? 'translate-y-[100%]'
                : 'translate-y-4'
            } md:translate-y-4`"
            enter-to="md:opacity-100 translate-y-0"
            leave="ease-in duration-5000"
            leave-from="md:opacity-100 translate-y-0"
            :leave-to="`md:opacity-0 ${
              fullscreen === 'mobile' || fullscreen === 'all'
                ? 'translate-y-[100%]'
                : 'translate-y-4'
            } md:translate-y-4`"
            @after-leave="$emit('fully-closed')"
          >
            <DialogPanel
              :class="dialogPanelClasses"
              dialog-panel-classes
              :as="isForm ? 'form' : 'div'"
              @submit.prevent="onFormSubmit"
            >
              <div
                v-if="hasTitle"
                class="border-b border-outline-3"
                :class="scrolledFromTop && 'relative z-20 shadow-lg'"
              >
                <div
                  class="flex items-center justify-start rounded-t-lg shrink-0 min-h-[2rem] sm:min-h-[3rem] px-6 py-4 truncate text-heading-sm"
                >
                  <div class="flex items-center pr-12">
                    <ChevronLeftIcon
                      v-if="showBackButton"
                      class="w-5 h-5 -ml-1 mr-3"
                      @click="$emit('back')"
                    />
                    <div class="w-full truncate">
                      {{ title }}
                      <slot name="header" />
                    </div>
                  </div>
                </div>
              </div>

              <!--
                Due to how forms work, if there's no other submit button, on form submission the first button
                will be clicked. This is a workaround to prevent the close button from being that first button.
                https://stackoverflow.com/a/4763911/3194577
              -->
              <button class="hidden" type="button" />

              <FormButton
                v-if="!hideCloser"
                color="subtle"
                size="sm"
                class="absolute z-20 top-4 right-5 shrink-0 !w-6 !h-6 !p-0"
                @click="open = false"
              >
                <XMarkIcon class="h-6 w-6 text-foreground-2" />
              </FormButton>
              <div ref="slotContainer" :class="slotContainerClasses" @scroll="onScroll">
                <slot>Put your content here!</slot>
              </div>
              <div
                v-if="hasButtons"
                class="relative z-50 flex justify-end px-6 pb-6 space-x-2 shrink-0 bg-foundation-page"
                :class="{
                  'shadow-t pt-6': !scrolledToBottom,
                  [buttonsWrapperClasses || '']: true
                }"
              >
                <template v-if="buttons">
                  <FormButton
                    v-for="(button, index) in buttons"
                    :key="button.id || index"
                    v-bind="button.props || {}"
                    :disabled="button.props?.disabled || button.disabled"
                    :submit="button.props?.submit || button.submit"
                    @click="($event) => button.onClick?.($event)"
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
import { FormButton, type LayoutDialogButton } from '~~/src/lib'
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'
import { useResizeObserver, type ResizeObserverCallback } from '@vueuse/core'
import { computed, ref, useSlots, watch, onUnmounted } from 'vue'
import { throttle } from 'lodash'
import { isClient } from '@vueuse/core'

type MaxWidthValue = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type FullscreenValues = 'mobile' | 'desktop' | 'all' | 'none'

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
  (e: 'fully-closed'): void
  (e: 'back'): void
}>()

const props = withDefaults(
  defineProps<{
    open: boolean
    maxWidth?: MaxWidthValue
    fullscreen?: FullscreenValues
    hideCloser?: boolean
    showBackButton?: boolean
    /**
     * Prevent modal from closing when the user clicks outside of the modal or presses Esc
     */
    preventCloseOnClickOutside?: boolean
    title?: string
    buttons?: Array<LayoutDialogButton>
    /**
     * Extra classes to apply to the button container.
     */
    buttonsWrapperClasses?: string
    /**
     * If set, the modal will be wrapped in a form element and the `onSubmit` callback will be invoked when the user submits the form
     */
    onSubmit?: (e: SubmitEvent) => void
  }>(),
  {
    fullscreen: 'mobile'
  }
)

const slots = useSlots()

const scrolledFromTop = ref(false)
const scrolledToBottom = ref(true)
const slotContainer = ref<HTMLElement | null>(null)

useResizeObserver(
  slotContainer,
  throttle<ResizeObserverCallback>(() => {
    // Triggering onScroll on size change too so that we don't get stuck with shadows
    // even tho the new content is not scrollable
    onScroll({ target: slotContainer.value })
  }, 60)
)

const isForm = computed(() => !!props.onSubmit)
const hasButtons = computed(() => props.buttons || slots.buttons)
const hasTitle = computed(() => !!props.title || !!slots.header)

const open = computed({
  get: () => props.open,
  set: (newVal) => emit('update:open', newVal)
})

const maxWidthWeight = computed(() => {
  switch (props.maxWidth) {
    case 'xs':
      return 0
    case 'sm':
      return 1
    case 'md':
      return 2
    case 'lg':
      return 3
    case 'xl':
      return 4
    default:
      return 10000
  }
})

const widthClasses = computed(() => {
  const classParts: string[] = ['w-full', 'sm:w-full']

  if (!isFullscreenDesktop.value) {
    if (maxWidthWeight.value === 0) {
      classParts.push('md:max-w-sm')
    }
    if (maxWidthWeight.value >= 1) {
      classParts.push('md:max-w-lg')
    }
    if (maxWidthWeight.value >= 2) {
      classParts.push('md:max-w-2xl')
    }
    if (maxWidthWeight.value >= 3) {
      classParts.push('lg:max-w-3xl')
    }
    if (maxWidthWeight.value >= 4) {
      classParts.push('xl:max-w-6xl')
    } else {
      classParts.push('md:max-w-2xl')
    }
  }

  return classParts.join(' ')
})

const isFullscreenDesktop = computed(
  () => props.fullscreen === 'desktop' || props.fullscreen === 'all'
)

const dialogPanelClasses = computed(() => {
  const classParts: string[] = [
    'transform md:rounded-xl text-foreground overflow-hidden transition-all bg-foundation-page text-left shadow-xl border border-outline-2 flex flex-col md:h-auto'
  ]

  if (isFullscreenDesktop.value) {
    classParts.push('md:h-full')
  } else {
    classParts.push('md:max-h-[90vh]')
  }

  if (props.fullscreen === 'mobile' || props.fullscreen === 'all') {
    classParts.push('max-md:h-[98vh] max-md:!h-[98dvh]')
  }

  if (props.fullscreen === 'none' || props.fullscreen === 'desktop') {
    classParts.push('rounded-lg max-h-[90vh]')
  } else {
    classParts.push('rounded-t-lg')
  }

  classParts.push(widthClasses.value)
  return classParts.join(' ')
})

const slotContainerClasses = computed(() => {
  const classParts: string[] = ['flex-1 simple-scrollbar overflow-y-auto text-body-xs']

  if (hasTitle.value) {
    classParts.push('px-6 py-4')
    if (isFullscreenDesktop.value) {
      classParts.push('md:p-0')
    }
  } else if (!isFullscreenDesktop.value) {
    classParts.push('px-6 py-4')
  }

  return classParts.join(' ')
})

const onClose = () => {
  if (props.preventCloseOnClickOutside) return
  open.value = false
}

const onFormSubmit = (e: SubmitEvent) => {
  props.onSubmit?.(e)
}

const onScroll = throttle((e: { target: EventTarget | null }) => {
  if (!e.target) return

  const target = e.target as HTMLElement
  const { scrollTop, offsetHeight, scrollHeight } = target
  scrolledFromTop.value = scrollTop > 0
  scrolledToBottom.value = scrollTop + offsetHeight >= scrollHeight
}, 60)

// Toggle 'dialog-open' class on <html> to prevent scroll jumping and disable background scroll.
// This maintains user scroll position when Headless UI dialogs are activated.
watch(open, (newValue) => {
  if (isClient) {
    const html = document.documentElement
    if (newValue) {
      html.classList.add('dialog-open')
    } else {
      html.classList.remove('dialog-open')
    }
  }
})

// Clean up when the component unmounts
onUnmounted(() => {
  if (isClient) {
    document.documentElement.classList.remove('dialog-open')
  }
})
</script>

<style>
html.dialog-open {
  overflow: visible !important;
}
html.dialog-open body {
  overflow: hidden !important;
}
</style>
