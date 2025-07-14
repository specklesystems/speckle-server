import { isClient, type UseElementBoundingReturn } from '@vueuse/core'
import { isUndefined } from 'lodash-es'
import { computed, unref, type ComputedRef, type CSSProperties } from 'vue'
import { HorizontalDirection } from '~~/src/composables/common/window'

/**
 * Simplifies correctly and responsively positioning (dropdown/right-click/etc) menus so that they open
 * to the correct direction, can change directions if there's not enough space or even go full screen
 * if there's no space in either direction.
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
}) => {
  const menuStyle = computed(() => {
    const style: CSSProperties = {}
    if (!isClient) return style // Not SSR compatible

    /**
     * 1.a. If menuWidth is bigger than screen width, use screen width
     * 1.b. If menuWidth is smaller than screen width, use menuWidth
     * 2. If 1.b. but menu is leaving screen bounds, make it open to other direction
     */

    const openToLeft = unref(params.menuOpenDirection) === HorizontalDirection.Left

    const top = params.buttonBoundingBox.top.value
    const left = params.buttonBoundingBox.left.value
    const width = params.buttonBoundingBox.width.value
    const height = params.buttonBoundingBox.height.value

    let finalWidth = width
    let finalLeft = left

    const menuWidth = unref(params.menuWidth)
    const viewportWidth = window.innerWidth
    const xMargin = 10 // how much space to leave in full-screen mode
    const viewportWithoutMargins = viewportWidth - xMargin * 2

    if (!isUndefined(menuWidth)) {
      if (menuWidth > viewportWithoutMargins) {
        // Menu too big: use full screen width
        finalWidth = viewportWithoutMargins
        finalLeft = xMargin
      } else {
        // Open to right or left depending on available space
        finalWidth = menuWidth

        if (openToLeft) {
          finalLeft = left + width - menuWidth
          if (finalLeft < xMargin) {
            finalLeft = xMargin
          }
        } else {
          if (left + menuWidth > viewportWithoutMargins) {
            finalLeft = Math.max(left + width - menuWidth, xMargin)
          }
        }
      }
    }

    style.left = `${finalLeft}px`
    style.width = `${finalWidth}px`
    style.top = `${top + height}px`

    return style
  })

  return { menuStyle }
}
