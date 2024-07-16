<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 mt-10 sm:items-start sm:p-6 z-50"
  >
    <div class="flex w-full flex-col items-center gap-4 sm:items-end">
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
          class="pointer-events-auto w-full max-w-[20rem] overflow-hidden rounded-lg bg-foundation text-foreground shadow-lg ring-1 ring-primary-muted ring-opacity-5"
          :class="isTitleOnly ? 'p-2' : 'p-3'"
        >
          <div class="flex gap-2" :class="isTitleOnly ? 'items-center' : 'items-start'">
            <div class="flex-shrink-0">
              <CheckCircleIcon
                v-if="notification.type === ToastNotificationType.Success"
                class="text-success"
                :class="isTitleOnly ? 'h-5 w-5' : 'h-6 w-6'"
                aria-hidden="true"
              />
              <XCircleIcon
                v-else-if="notification.type === ToastNotificationType.Danger"
                class="text-danger"
                :class="isTitleOnly ? 'h-5 w-5' : 'h-6 w-6'"
                aria-hidden="true"
              />
              <ExclamationCircleIcon
                v-else-if="notification.type === ToastNotificationType.Warning"
                class="text-warning"
                :class="isTitleOnly ? 'h-5 w-5' : 'h-6 w-6'"
                aria-hidden="true"
              />
              <InformationCircleIcon
                v-else-if="notification.type === ToastNotificationType.Info"
                class="text-info"
                :class="isTitleOnly ? 'h-5 w-5' : 'h-6 w-6'"
                aria-hidden="true"
              />
            </div>
            <div class="w-full min-w-[10rem]">
              <p
                v-if="notification.title"
                class="text-foreground font-bold"
                :class="isTitleOnly ? 'text-sm' : 'text-base'"
              >
                {{ notification.title }}
              </p>
              <p
                v-if="notification.description"
                class="label label--light text-foreground-2 text-sm"
              >
                {{ notification.description }}
              </p>
              <div v-if="notification.cta">
                <CommonTextLink
                  :to="notification.cta.url"
                  class="label"
                  size="xs"
                  primary
                  @click="onCtaClick"
                >
                  {{ notification.cta.title }}
                </CommonTextLink>
              </div>
            </div>
            <div class="ml-2 flex-shrink-0" :class="isTitleOnly ? 'mt-1.5' : ''">
              <button
                type="button"
                class="inline-flex rounded-md bg-foundation text-foreground-2 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                @click="dismiss"
              >
                <span class="sr-only">Close</span>
                <XMarkIcon class="h-5 w-5" aria-hidden="true" />
              </button>
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
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { ToastNotificationType } from '~~/src/helpers/global/toast'
import type { ToastNotification } from '~~/src/helpers/global/toast'

const emit = defineEmits<{
  (e: 'update:notification', val: MaybeNullOrUndefined<ToastNotification>): void
}>()

const props = defineProps<{
  notification: MaybeNullOrUndefined<ToastNotification>
}>()

const isTitleOnly = computed(
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
