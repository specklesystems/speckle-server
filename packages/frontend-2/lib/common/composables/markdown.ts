import type { MaybeRef } from '@vueuse/core'
import { marked } from 'marked'
import PlaintextRenderer from 'marked-plaintext'
import { usePurifiedHtml } from '~/lib/common/composables/dom'

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
      renderer: {
        ...new PlaintextRenderer(),
        link(href, title, text) {
          return `<a style="color: red;" href=${href}>${text}</a>`
        },
        text(text) {
          return `<p>${text}</p>`
        },
        heading(text, level) {
          return `<p>${text}</p>`
        },
        paragraph(text) {
          return `<p>${text}</p>`
        }
        // plaintext ? new PlaintextRenderer() : undefined
      }
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
