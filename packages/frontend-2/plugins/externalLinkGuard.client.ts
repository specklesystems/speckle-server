import { useExternalLinkDialogController } from '~/lib/common/composables/externalLinkDialog'

export default defineNuxtPlugin(() => {
  const { confirm } = useExternalLinkDialogController()

  const handler = (e: MouseEvent) => {
    // Ignore modified / non-left clicks
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return

    const a = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null
    if (!a) return

    if (a.hasAttribute('download') || a.closest('[data-no-external-confirm]')) return

    const url = new URL(a.href, window.location.href)

    const isWhitelisted = (url: URL) =>
      url.hostname === 'speckle.systems' ||
      url.hostname.endsWith('.speckle.systems') ||
      url.hostname === 'speckle.community' ||
      url.hostname.endsWith('.speckle.community')

    if (isWhitelisted(url) || url.origin === window.location.origin) return

    e.preventDefault()
    void confirm(a.href)
  }

  document.addEventListener('click', handler, true)
})
