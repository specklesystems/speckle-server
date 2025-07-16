import { useGlobalExternalLinkDialog } from '~/lib/common/composables/externalLinkDialog'

export default defineNuxtPlugin(() => {
  const { confirm } = useGlobalExternalLinkDialog()

  const handler = (e: MouseEvent) => {
    // Ignore modified / non-left clicks
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
    if (!a) return
    if (a.hasAttribute('data-no-external-confirm') || a.hasAttribute('download')) return

    const url = new URL(a.href, window.location.href)

    if (url.origin === window.location.origin) {
      e.preventDefault()

      const path = url.pathname + url.search + url.hash
      navigateTo(path)
      return
    }

    e.preventDefault()
    void confirm(a.href)
  }

  document.addEventListener('click', handler, true)
})
