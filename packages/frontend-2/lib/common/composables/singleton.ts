import { nanoid } from 'nanoid'
import { useScopedState } from '~~/lib/common/composables/scopedState'
import type { MaybeRef } from '@vueuse/core'

const useComponentLockState = () =>
  useScopedState('componentLockState', () =>
    shallowRef(new Array<{ key: string; instanceId: string }>())
  )

/**
 * A lock that is scoped to a component. If multiple instances of the same lock composable are invoked,
 * only the first one will have the lock.
 *
 * The lock is released when the component that owns the composable invocation is unmounted
 */
export const useLock = (key: MaybeRef<string>) => {
  const instanceId = nanoid()
  const lockState = useComponentLockState()

  const isActiveInstance = computed(() => {
    return (
      lockState.value.find((lock) => lock.key === unref(key))?.instanceId === instanceId
    )
  })

  // On unmount, remove this instance from the list of active instances
  onBeforeUnmount(() => {
    lockState.value = lockState.value.filter(
      (lock) => lock.key !== unref(key) || lock.instanceId !== instanceId
    )
  })

  watch(
    lockState,
    () => {
      // If there is no active instance, mark this as the active one
      if (!lockState.value.find((lock) => lock.key === unref(key))) {
        lockState.value = [...lockState.value, { key: unref(key), instanceId }]
      }
    },
    { immediate: true }
  )

  watch(
    () => unref(key),
    (newKey, oldKey) => {
      if (newKey === oldKey) return

      // If the key changes, remove the old key from the list of active instances
      lockState.value = lockState.value.filter(
        (lock) => lock.key !== oldKey || lock.instanceId !== instanceId
      )
    }
  )

  return { hasLock: isActiveInstance }
}
