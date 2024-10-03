import type { MaybeRef } from '@vueuse/core'
import { marked } from 'marked'
import PlaintextRenderer from 'marked-plaintext'
import { usePurifiedHtml } from '~/lib/common/composables/dom'

export const proseClasses = [
  'prose-sm max-w-none',
  'prose-img:inline',
  'prose-img:my-0',
  'prose-h1:h2 prose-h1:font-medium prose-h1:mb-8',
  'prose-h2:h3 prose-h2:font-medium prose-h2:mt-0 prose-h2:mb-6',
  'prose-h3:h4 prose-h3:mb-4',
  'prose-h4:h5 prose-h4:mb-4',
  'prose-h5:h6 prose-h5:mb-4 prose-h5:font-medium',
  'prose-h6:h6 prose-h6:mb-4 prose-h6:font-medium prose-h6:text-sm',
  'dark:prose-invert',
  'prose-ul:list-disc prose-ol:list-decimal'
]

export const useMarkdown = (
  source: MaybeRef<string>,
  options?: Partial<{
    sanitize: boolean
    plaintext: boolean
    key: string
    debugKey?: string
    /**
     * If set, composable will wait for this to be true before returning. Useful in SSR
     * when the markdown source is dependant on a query result
     */
    waitFor?: Ref<boolean>
  }>
) => {
  const {
    sanitize = true,
    plaintext = false,
    key: keySuffix,
    debugKey,
    waitFor
  } = options || {}

  const baseHtml = computed(() =>
    marked(unref(source), {
      mangle: false,
      headerIds: false,
      renderer: plaintext ? new PlaintextRenderer() : undefined
    })
  )
  const { purifiedHtml: html } = sanitize
    ? usePurifiedHtml(baseHtml, {
        key: keySuffix ? `useMarkdown-${keySuffix}` : undefined,
        debugKey,
        waitFor
      })
    : { purifiedHtml: baseHtml }

  return { html }
}
