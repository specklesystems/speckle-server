import { isClient, type UseElementBoundingReturn } from '@vueuse/core'
import { isUndefined } from '#lodash'
import { computed, unref, type ComputedRef, type CSSProperties } from 'vue'
import { HorizontalDirection } from '~~/src/composables/common/window'

/**
 * Simplifies correctly and responsively positioning (dropdown/right-click/etc) menus so that they open
 * to the correct direction, can change directions if there's not enough space or even go full screen
 * if there's no space in either direction.
 *
 * Also supports updating vertical position, incase the menu would clip w/ the bottom of the screen
 */
export const useBodyMountedMenuPositioning = (params: {
  /**
   * The direction the open should preferably open in, assuming it has the space to do so
   */
  menuOpenDirection?: ComputedRef<HorizontalDirection>
  /**
   * useElementBounding() of the button that opens the menu
   */
  buttonBoundingBox: UseElementBoundingReturn
  /**
   * Set the target menu width. If not available, will try a very basic positioning method
   * that just uses the button width.
   */
  menuWidth: ComputedRef<number | undefined>
  /**
   * Optionally also control target menu height.
   */
  menuHeight?: ComputedRef<number | undefined>
}) => {
  const menuStyle = computed(() => {
    const style: CSSProperties = {}
    if (!isClient) return style // Not SSR compatible

    /**
     * 1.a. If menuWidth is bigger than screen width, use screen width
     * 1.b. If menuWidth is smaller than screen width, use menuWidth
     * 2. If 1.b. but menu is leaving screen bounds, make it open to other direction
     *
     * Also:
     * 1.a. If menuHeight is bigger than screen height, use screen height
     * 1.b. If menuHeight is smaller than screen height, use screenHeight
     * 2. If 1.b. but menu is leaving screen bounds, make it open to other direction (upwards)
     */

    const openToLeft = unref(params.menuOpenDirection) === HorizontalDirection.Left

    const top = params.buttonBoundingBox.top.value
    const left = params.buttonBoundingBox.left.value
    const width = params.buttonBoundingBox.width.value
    const height = params.buttonBoundingBox.height.value
    const margin = 4 // how much space to leave in full-screen mode or between button and menu

    let finalWidth = width
    let finalLeft = left
    let finalTop = top + height + margin

    const menuWidth = unref(params.menuWidth)
    const menuHeight = unref(params?.menuHeight)

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const viewportWidthWithoutMargins = viewportWidth - margin * 2
    const viewportHeightWithoutMargins = viewportHeight - margin * 2

    if (!isUndefined(menuWidth)) {
      if (menuWidth > viewportWidthWithoutMargins) {
        // Menu too big: use full screen width
        finalWidth = viewportWidthWithoutMargins
        finalLeft = margin
      } else {
        // Open to right or left depending on available space
        finalWidth = menuWidth

        if (openToLeft) {
          finalLeft = left + width - menuWidth
          if (finalLeft < margin) {
            finalLeft = margin
          }
        } else {
          if (left + menuWidth > viewportWidthWithoutMargins) {
            finalLeft = Math.max(left + width - menuWidth, margin)
          }
        }
      }
    }

    if (!isUndefined(menuHeight)) {
      if (menuHeight > viewportHeightWithoutMargins) {
        finalTop = margin
      } else {
        // By default opens downward, see if we need to move upward instead
        if (top + height + menuHeight > viewportHeightWithoutMargins) {
          finalTop = top - menuHeight - margin
        }
      }
    }

    style.left = `${finalLeft}px`
    style.width = `${finalWidth}px`
    style.top = `${finalTop}px`

    return style
  })

  return { menuStyle }
}
