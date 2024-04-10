import DOMPurify from 'dompurify'

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
