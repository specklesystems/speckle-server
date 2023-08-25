import { useEventHub } from '@/main/lib/core/composables/core'
import { useRoute } from '@/main/lib/core/composables/router'
import Vue, { onBeforeUnmount, onMounted, Ref, ref, unref, watch } from 'vue'

/**
 * Sets up v-navigation-drawer autoresize (ask @dim how this works)
 */
export function useNavigationDrawerAutoResize(params: {
  navRestWidth?: number
  borderSize?: number
  drawerRef: Ref<Vue | null> | Vue
}) {
  const { navRestWidth = 300, borderSize = 3, drawerRef } = params
  const navWidth = ref<string | number>(navRestWidth)
  const minSize = borderSize

  const route = useRoute()
  const eventHub = useEventHub()
  const drawerEl = () => {
    const comp = unref(drawerRef)
    if (!comp)
      throw new Error(
        "Couldn't resolve drawer ref! Is it returned from the setup function?"
      )

    return comp.$el as HTMLElement
  }

  // Adjust navigation width according to route metadata
  watch(
    () => route,
    (to) => {
      if (!to.meta?.resizableNavbar) {
        navWidth.value = navRestWidth
      }
      if (to.meta?.resizableNavbar && window.__lastNavSize) {
        navWidth.value = window.__lastNavSize
      }
    },
    { immediate: true }
  )

  function onMouseMove(e: MouseEvent) {
    e.preventDefault()
    const el = drawerEl()

    const maxWidth = document.body.offsetWidth / 2
    const minWidth = 300

    document.body.style.cursor = 'ew-resize'
    if (!(e.clientX > maxWidth || e.clientX < minWidth)) {
      el.style.width = e.clientX + 'px'
      window.__lastNavSize = e.clientX
    }
  }

  function onMouseDown(e: MouseEvent) {
    e.preventDefault()
    const el = drawerEl()

    if (e.offsetX < minSize) {
      el.style.transition = 'initial'
      document.addEventListener('mousemove', onMouseMove, false)
    }
  }

  function onMouseUp(e: MouseEvent) {
    e.preventDefault()
    const el = drawerEl()

    el.style.transition = ''
    document.body.style.cursor = ''
    navWidth.value = el.style.width
    document.removeEventListener('mousemove', onMouseMove, false)
    setTimeout(() => {
      // @Dim: Why are we resizing the viewer here? We generally want to avoid needless resizes
      eventHub.$emit('resize-viewer')
    }, 300)
  }

  // Setup resize events
  onMounted(() => {
    const el = drawerEl()
    const drawerBorder = el.querySelector<HTMLElement>('.nav-resizer')
    if (drawerBorder) {
      drawerBorder.style.cursor = 'ew-resize'
      drawerBorder.addEventListener('mousedown', onMouseDown, false)
    }

    document.addEventListener('mouseup', onMouseUp, false)
  })

  // Unsub events
  onBeforeUnmount(() => {
    const el = drawerEl()
    const drawerBorder = el.querySelector<HTMLElement>('.nav-resizer')

    if (drawerBorder) {
      drawerBorder.removeEventListener('mousedown', onMouseDown)
    }

    document.removeEventListener('mouseup', onMouseUp)
    document.removeEventListener('mousemove', onMouseMove)
  })

  return {
    navWidth
  }
}
