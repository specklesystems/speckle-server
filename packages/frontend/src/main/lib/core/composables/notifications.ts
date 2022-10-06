import { Nullable } from '@/helpers/typeHelpers'
import { useEventHub } from '@/main/lib/core/composables/core'
import {
  GlobalEvents,
  NotificationEventPayload,
  ToastNotificationType
} from '@/main/lib/core/helpers/eventHubHelper'
import Vue, { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const globalToastState = Vue.observable({
  isInitialized: false,
  queuedNotifications: [] as NotificationEventPayload[]
})

const isInitialized = () => !!globalToastState.isInitialized
const queuedNotifications = () => globalToastState.queuedNotifications
const resetQueue = () => (globalToastState.queuedNotifications = [])
const queueNotification = (e: NotificationEventPayload) => {
  const notifications = queuedNotifications().slice()
  notifications.push(e)
  Vue.set(globalToastState, 'queuedNotifications', notifications)
}

/**
 * Invoke this only in GlobalToast.vue to properly initialize it
 */
export function setupGlobalToast() {
  const eventHub = useEventHub()

  const snack = ref(false)
  const text = ref(null as Nullable<string>)
  const actionName = ref(null as Nullable<string>)
  const to = ref(null as Nullable<string>)
  const type = ref('primary' as ToastNotificationType)

  const color = computed((): ToastNotificationType => type.value || 'primary')

  watch(snack, (newVal) => {
    if (!newVal) {
      text.value = null
      actionName.value = null
      to.value = null
    }
  })

  const handleEvent = (e: NotificationEventPayload) => {
    // first set snack.value to false so that the previous notification gets removed
    // then wait for next tick so that we're sure vuetify has reset the timeout
    snack.value = false
    nextTick().then(() => {
      snack.value = true
      text.value = e.text
      actionName.value = e.action ? e.action.name : null
      to.value = e.action ? e.action.to : null
      type.value = e.type || 'primary'
    })
  }

  onMounted(() => {
    Vue.set(globalToastState, 'isInitialized', true)

    eventHub.$on(GlobalEvents.Notification, handleEvent)

    const queue = queuedNotifications()
    for (const queueItem of queue) {
      handleEvent(queueItem)
    }
    resetQueue()
  })

  onUnmounted(() => {
    Vue.set(globalToastState, 'isInitialized', false)

    eventHub.$off(GlobalEvents.Notification, handleEvent)
  })

  return {
    snack,
    text,
    actionName,
    to,
    type,
    color
  }
}

/**
 * Trigger notification or queue it up to be triggered when GlobalToast.vue is ready
 */
export async function triggerToastNotification(
  eventHub: Vue,
  e: NotificationEventPayload
) {
  if (isInitialized()) {
    eventHub.$emit(GlobalEvents.Notification, e)
  } else {
    queueNotification(e)
  }
}

/**
 * Allows you to emit toast notifications
 */
export function useGlobalToast() {
  const eventHub = useEventHub()

  return {
    /**
     * Trigger a toast notification
     */
    triggerNotification: (args: NotificationEventPayload) => {
      triggerToastNotification(eventHub, args)
    }
  }
}
