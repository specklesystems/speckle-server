import { timeoutAt } from '@speckle/shared'
import { until } from '@vueuse/core'
import DOMPurify from 'dompurify'

const purify = async (source: string) => {
  let purify: DOMPurify.DOMPurifyI

  if (import.meta.server) {
    const jsdom = await import('jsdom')
    const window = new jsdom.JSDOM('').window
    purify = DOMPurify(window)
  } else {
    purify = DOMPurify
  }

  return purify.sanitize(source)
}

export function usePurifiedHtml(
  html: MaybeRef<string>,
  options?: Partial<{
    key: string
    debugKey?: string
    /**
     * If set, composable will wait for this to be true before returning. Useful in SSR
     * when the markdown source is dependant on a query result
     */
    waitFor?: Ref<boolean>
  }>
) {
  const htmlRef = computed(() => unref(html) || '')
  const { key: keySuffix, waitFor } = options || {}
  const key = computed(() => `usePurifiedHtml-${htmlRef.value}-${keySuffix}`)

  const asyncData = useAsyncData(
    key.value,
    async () => {
      if (!htmlRef.value?.length) return
      return purify(htmlRef.value)
    },
    { watch: [key] }
  )

  onServerPrefetch(async () => {
    if (!waitFor) return

    await Promise.race([
      until(waitFor).toBe(true),
      timeoutAt(10000, 'Waiting for HTML purification trigger timed out')
    ])
    await asyncData.refresh()
  })

  return {
    purifiedHtml: computed(() => asyncData.data.value || '')
  }
}
