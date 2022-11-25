<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-10"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <!-- Notification panel, dynamically insert this into the live region when it needs to be displayed -->
      <Transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-100"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="currentNotification"
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-foundation text-foreground shadow-lg ring-1 ring-primary-muted ring-opacity-5"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <CheckCircleIcon
                  v-if="currentNotification.type === ToastNotificationType.Success"
                  class="h-6 w-6 text-success"
                  aria-hidden="true"
                />
                <XCircleIcon
                  v-else-if="currentNotification.type === ToastNotificationType.Danger"
                  class="h-6 w-6 text-danger"
                  aria-hidden="true"
                />
                <ExclamationCircleIcon
                  v-else-if="currentNotification.type === ToastNotificationType.Warning"
                  class="h-6 w-6 text-warning"
                  aria-hidden="true"
                />
                <InformationCircleIcon
                  v-else-if="currentNotification.type === ToastNotificationType.Info"
                  class="h-6 w-6 text-info"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-2 w-0 flex-1 pt-0.5 flex flex-col">
                <p class="label text-foreground">
                  {{ currentNotification.title }}
                </p>
                <p
                  v-if="currentNotification.description"
                  class="mt-1 label label--light text-foreground-3"
                >
                  {{ currentNotification.description }}
                </p>
                <div v-if="currentNotification.cta" class="flex justify-start mt-2">
                  <CommonTextLink
                    :to="currentNotification.cta.url"
                    class="label"
                    primary
                    @click="onCtaClick"
                  >
                    {{ currentNotification.cta.title }}
                  </CommonTextLink>
                </div>
              </div>
              <div
                class="ml-4 flex flex-shrink-0"
                :class="{ 'self-center': shouldVerticallyCenterCloser }"
              >
                <button
                  type="button"
                  class="inline-flex rounded-md bg-foundation text-foreground-2 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  @click="dismiss"
                >
                  <span class="sr-only">Close</span>
                  <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import {
  useGlobalToastManager,
  ToastNotificationType
} from '~~/lib/common/composables/toast'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/20/solid'

const { currentNotification, dismiss } = useGlobalToastManager()

const shouldVerticallyCenterCloser = computed(
  () => !currentNotification.value?.description && !currentNotification.value?.cta
)

const onCtaClick = (e: MouseEvent) => {
  currentNotification.value?.cta?.onClick?.(e)
  dismiss()
}
</script>
