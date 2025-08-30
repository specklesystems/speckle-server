import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useDashboardEmbed() {
  const route = useRoute()

  const isEmbedEnabled = computed(() => {
    // Check for embed parameter in query string
    if (route.query.embed === 'true') {
      return true
    }

    // Check for embed parameter in hash fragment
    if (route.hash) {
      const hashParams = new URLSearchParams(route.hash.substring(1))
      const embedParam = hashParams.get('embed')
      if (embedParam === 'true') {
        return true
      }
    }

    // Check if the page is being loaded in an iframe
    if (import.meta.client) {
      try {
        return window.self !== window.top
      } catch {
        // If we can't access window.top due to cross-origin restrictions,
        // it's likely an embed
        return true
      }
    }

    return false
  })

  const isCrossOriginEmbed = computed(() => {
    if (!isEmbedEnabled.value || !import.meta.client) return false

    try {
      return window.location.origin !== window.top?.location.origin
    } catch {
      // If we can't access window.top.location.origin due to cross-origin restrictions,
      // it's definitely a cross-origin embed
      return true
    }
  })

  return {
    isEmbedEnabled,
    isCrossOriginEmbed
  }
}
