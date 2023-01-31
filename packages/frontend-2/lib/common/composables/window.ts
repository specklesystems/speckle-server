import { debounce, throttle } from 'lodash-es'

export enum ThrottleOrDebounce {
  Throttle,
  Debounce
}

export function useWindowResizeHandler(
  handler: (e: UIEvent) => void,
  options?: Partial<{
    wait: number
    throttleOrDebounce: ThrottleOrDebounce
  }>
) {
  if (process.server) return

  const { wait = 100, throttleOrDebounce = ThrottleOrDebounce.Throttle } = options || {}
  const finalHandler = wait
    ? throttleOrDebounce === ThrottleOrDebounce.Throttle
      ? throttle(handler, wait)
      : debounce(handler, wait)
    : handler

  onMounted(() => window.addEventListener('resize', finalHandler))
  onBeforeUnmount(() => window.removeEventListener('resize', finalHandler))
}
