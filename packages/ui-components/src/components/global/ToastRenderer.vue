<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 mt-10 sm:items-start sm:p-6 z-50"
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
          v-if="notification"
          class="pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-foundation text-foreground shadow-lg ring-1 ring-primary-muted ring-opacity-5"
        >
          <div class="p-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <CheckCircleIcon
                  v-if="notification.type === ToastNotificationType.Success"
                  class="h-6 w-6 text-success"
                  aria-hidden="true"
                />
                <XCircleIcon
                  v-else-if="notification.type === ToastNotificationType.Danger"
                  class="h-6 w-6 text-danger"
                  aria-hidden="true"
                />
                <ExclamationCircleIcon
                  v-else-if="notification.type === ToastNotificationType.Warning"
                  class="h-6 w-6 text-warning"
                  aria-hidden="true"
                />
                <InformationCircleIcon
                  v-else-if="notification.type === ToastNotificationType.Info"
                  class="h-6 w-6 text-info"
                  aria-hidden="true"
                />
              </div>
              <div class="ml-2 w-0 flex-1 flex flex-col">
                <p v-if="notification.title" class="text-foreground font-bold">
                  {{ notification.title }}
                </p>
                <p
                  v-if="notification.description"
                  class="label label--light text-foreground-2"
                >
                  {{ notification.description }}
                </p>
                <div v-if="notification.cta" class="flex justify-start mt-2">
                  <CommonTextLink
                    :to="notification.cta.url"
                    class="label"
                    primary
                    @click="onCtaClick"
                  >
                    {{ notification.cta.title }}
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
import CommonTextLink from '~~/src/components/common/text/Link.vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import { XMarkIcon } from '@heroicons/vue/20/solid'
import { computed } from 'vue'
import { Nullable } from '@speckle/shared'
import { ToastNotification, ToastNotificationType } from '~~/src/helpers/global/toast'

const emit = defineEmits<{
  (e: 'update:notification', val: Nullable<ToastNotification>): void
}>()

const props = defineProps<{
  notification: Nullable<ToastNotification>
}>()

const shouldVerticallyCenterCloser = computed(
  () => !props.notification?.description && !props.notification?.cta
)

const dismiss = () => {
  emit('update:notification', null)
}

const onCtaClick = (e: MouseEvent) => {
  props.notification?.cta?.onClick?.(e)
  dismiss()
}
</script>
