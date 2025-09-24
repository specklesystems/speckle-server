<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed top-0 right-0 left-0 bottom-0 flex items-end px-4 py-6 mt-10 sm:items-start sm:p-6 z-[60]"
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
          class="flex pointer-events-auto w-full max-w-[20rem] overflow-hidden rounded bg-foundation text-foreground shadow-lg border border-outline-2 p-2 pl-3"
        >
          <div class="flex gap-2 items-center w-full">
            <div
              class="shrink-0"
              :class="{
                'self-start mt-0.5': notification.description || notification.cta
              }"
            >
              <CircleCheck
                v-if="notification.type === ToastNotificationType.Success"
                class="text-success h-4 w-4"
                aria-hidden="true"
              />
              <CircleX
                v-else-if="notification.type === ToastNotificationType.Danger"
                class="text-danger h-4 w-4"
                aria-hidden="true"
              />
              <AlertCircle
                v-else-if="notification.type === ToastNotificationType.Warning"
                class="text-foreground-2 h-4 w-4"
                aria-hidden="true"
              />
              <Info
                v-else-if="notification.type === ToastNotificationType.Info"
                class="text-foreground-2 h-4 w-4"
                aria-hidden="true"
              />
              <CommonLoadingIcon
                v-else-if="notification.type === ToastNotificationType.Loading"
                class="h-4 w-4 opacity-80"
              />
            </div>
            <div class="w-full min-w-[10rem]">
              <p
                v-if="notification.title"
                class="text-foreground text-body-xs font-medium"
              >
                {{ notification.title }}
              </p>
              <p
                v-if="notification.description"
                class="text-foreground-2 text-body-2xs leading-snug"
              >
                {{ notification.description }}
              </p>
              <div v-if="notification.cta">
                <TextLink :to="notification.cta.url" size="sm" @click="onCtaClick">
                  {{ notification.cta.title }}
                </TextLink>
              </div>
            </div>
            <FormButton
              :icon-left="X"
              color="subtle"
              size="sm"
              hide-text
              class="shrink-0 ml-auto"
              :class="{
                'self-start -mt-0.5 -mr-0.5':
                  notification.description || notification.cta
              }"
              @click="dismiss"
            >
              Close
            </FormButton>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
<script setup lang="ts">
import TextLink from '~~/src/components/common/text/Link.vue'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import { ToastNotificationType } from '~~/src/helpers/global/toast'
import type { ToastNotification } from '~~/src/helpers/global/toast'
import { CommonLoadingIcon, FormButton } from '~~/src/lib'
import { X, CircleCheck, CircleX, AlertCircle, Info } from 'lucide-vue-next'

const emit = defineEmits<{
  (e: 'update:notification', val: MaybeNullOrUndefined<ToastNotification>): void
}>()

const props = defineProps<{
  notification: MaybeNullOrUndefined<ToastNotification>
}>()

const dismiss = () => {
  emit('update:notification', null)
}

const onCtaClick = (e: MouseEvent) => {
  props.notification?.cta?.onClick?.(e)
  dismiss()
}
</script>
