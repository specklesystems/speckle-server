import DOMPurify from 'dompurify'
import { debounce } from 'lodash-es'

/**
 * Allow debounced value tracking, common in search input boxes
 */
export function useDebouncedInputValue(params?: {
  debounceBy?: number
  onValueUpdated?: (val: string) => void
}) {
  const { debounceBy = 1000, onValueUpdated } = params || {}
  const val = ref<string>('')

  const updateModelValueHandler = debounce((value: string) => {
    val.value = value
  }, debounceBy)

  if (onValueUpdated) {
    watch(val, (newVal, oldVal) => {
      if (newVal === oldVal) return
      onValueUpdated(newVal)
    })
  }

  return {
    value: computed(() => val.value),
    changeHandler: (params: { value: string }) => {
      updateModelValueHandler.cancel()
      val.value = params.value
    },
    updateModelValueHandler
  }
}

const purify = async (source: string) => {
  let purify: DOMPurify.DOMPurifyI

  if (process.server) {
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
  options?: Partial<{ key: string }>
) {
  const { key: keySuffix } = options || {}
  const key = computed(() => `usePurifiedHtml-${unref(html)}-${keySuffix}`)

  const { data } = useAsyncData(
    key.value,
    async () => {
      if (!unref(html)) return
      return purify(unref(html))
    },
    { watch: [key] }
  )

  return {
    purifiedHtml: computed(() => data.value || '')
  }
}
