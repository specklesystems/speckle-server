import type { CalApi, EmbedThemeConfig } from '~/lib/cal/types/cal'
import { initCal } from '~/lib/cal/library/cal'

export function initCalWidget(options: {
  namespace: string
  calLink?: string
  theme?: EmbedThemeConfig
  mode?: 'inline' | 'element-click'
  elementOrSelector?: string | HTMLElement
}): CalApi | null {
  const {
    namespace,
    calLink,
    theme = 'auto',
    mode = 'inline',
    elementOrSelector
  } = options

  const Cal = initCal()
  if (!Cal) return null

  Cal('init', namespace, { origin: 'https://cal.com' })

  if (mode === 'inline' && elementOrSelector && calLink) {
    Cal.ns[namespace]('inline', {
      elementOrSelector,
      calLink,
      config: { layout: 'month_view', theme }
    })
  }

  Cal.ns[namespace]('ui', {
    hideEventTypeDetails: false,
    layout: 'month_view',
    theme
  })

  return Cal
}
