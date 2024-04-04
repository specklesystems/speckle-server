import type { MaybeRef } from '@vueuse/core'
import { marked } from 'marked'
import PlaintextRenderer from 'marked-plaintext'
import { usePurifiedHtml } from '~/lib/common/composables/dom'

export const useMarkdown = (
  source: MaybeRef<string>,
  options?: Partial<{ sanitize: boolean; plaintext: boolean; key: string }>
) => {
  const { sanitize = true, plaintext = false, key: keySuffix } = options || {}

  const baseHtml = computed(() =>
    marked(unref(source), {
      mangle: false,
      headerIds: false,
      renderer: plaintext ? new PlaintextRenderer() : undefined
    })
  )
  const { purifiedHtml: html } = sanitize
    ? usePurifiedHtml(baseHtml, {
        key: keySuffix ? `useMarkdown-${keySuffix}` : undefined
      })
    : { purifiedHtml: baseHtml }

  return { html }
}
