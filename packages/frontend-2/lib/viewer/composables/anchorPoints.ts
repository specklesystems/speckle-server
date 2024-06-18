import type { CSSProperties, Ref } from 'vue'
import type { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import type { Vector3 } from 'three'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import type { IntersectionQuery, PointQuery } from '@speckle/viewer'
import { isArray, round } from 'lodash-es'
import { useViewerCameraTracker } from '~~/lib/viewer/composables/viewer'
import { useWindowResizeHandler } from '~~/lib/common/composables/window'

export function useViewerAnchoredPointCalculator(params: {
  /**
   * Viewer anchor point parent element that has to have the same exact dimensions as the full
   * viewer viewport
   */
  parentEl: Ref<Nullable<HTMLElement>>
}) {
  const { parentEl } = params
  const {
    viewer: { instance: viewer }
  } = useInjectedViewerState()

  /**
   * Calculate current screen coordinates of a location in the 3D space of the viewer,
   * whether or not that point is occluded by something and CSS styles for the DOM element
   * to position it correctly within the parent element.
   *
   * Note: Screen coordinate location will be null if `parentEl` is null.
   */
  const calculate = (target: Vector3) => {
    let targetLoc: Nullable<{ x: number; y: number }> = null
    if (parentEl.value) {
      const targetProjectionResult = viewer.query<PointQuery>({
        point: target,
        operation: 'Project'
      })
      targetLoc = viewer.Utils.NDCToScreen(
        targetProjectionResult.x,
        targetProjectionResult.y,
        parentEl.value.clientWidth,
        parentEl.value.clientHeight
      )

      // round it out
      if (targetLoc) {
        targetLoc.x = round(targetLoc.x)
        targetLoc.y = round(targetLoc.y)
      }

      // logger.debug(targetLoc, targetProjectionResult, target, new Date().toISOString())
    }

    const targetOcclusionRes = viewer.query<IntersectionQuery>({
      point: target,
      tolerance: 0.001,
      operation: 'Occlusion'
    })

    return {
      screenLocation: targetLoc?.x && targetLoc?.y ? targetLoc : null,
      isOccluded: !!targetOcclusionRes.objects?.length,
      style: <Partial<CSSProperties>>{
        ...(targetLoc?.x && targetLoc?.y
          ? {
              transform: `translate(${targetLoc.x}px,${targetLoc.y}px)`,
              // transform: `translate(-50%, -50%) translate(${targetLoc.x}px,${targetLoc.y}px)`,
              transformOrigin: 'center',
              x: targetLoc.x,
              y: targetLoc.y,
              display: 'block'
            }
          : {
              display: 'none'
            })
      }
    }
  }

  return {
    calculate
  }
}

type AnchoredPointCalculateResult = ReturnType<
  ReturnType<typeof useViewerAnchoredPointCalculator>['calculate']
>

/**
 * Automatically recalculates screen positions & occlusion of the provided array of points, and
 * additionally exposes functions for manual (re-)calculation
 */
export function useViewerAnchoredPoints<
  O extends Record<string, unknown>,
  A extends Optional<Record<string, unknown>>
>(params: {
  /**
   * Viewer anchor point parent element that has to have the same exact dimensions as the full
   * viewer viewport
   */
  parentEl: Ref<Nullable<HTMLElement>>
  /**
   * Objects that contain points in viewer's 3D space that need to be anchored accordingly on the screen.
   * Can be an array or a single point.
   */
  points: Ref<O[] | O>
  /**
   * Use this to pull out the actual initial location Vector3 out from a specific point object. It
   * can also return null or undefined in which case calculation will be skipped.
   */
  pointLocationGetter: (obj: O) => MaybeNullOrUndefined<Vector3>
  /**
   * Callback for each position update operation for optionally doing extra stuff with the point object
   */
  updatePositionCallback: (
    obj: O,
    result: AnchoredPointCalculateResult,
    options?: A
  ) => void
}) {
  const { parentEl, points, pointLocationGetter, updatePositionCallback } = params
  const { calculate } = useViewerAnchoredPointCalculator({ parentEl })

  /**
   * Re-calculate positions for all points. Optionally pass in arbitrary options
   * that you will also receive in `updatePositionCallback` for making changes accordingly,
   * e.g. `smoothTranslations` to enable smoothed translation between positions.
   */
  const updatePositions = (options?: A) => {
    const pointsArray = isArray(points.value) ? points.value : [points.value]
    for (const point of pointsArray) {
      const location = pointLocationGetter(point)
      if (!location) continue

      const result = calculate(location)
      updatePositionCallback(point, result, options)
    }
  }

  // TODO: disabling throttle cause of jitteriness caused by (?) viewer queries, this needs to be looked at
  useViewerCameraTracker(() => updatePositions(), { throttleWait: 0 })
  useWindowResizeHandler(() => updatePositions(), { wait: 0 })

  watch(
    points,
    () => {
      updatePositions()
    },
    { immediate: true }
  )

  return {
    updatePositions,
    calculate
  }
}

export function useGetScreenCenterObjectId() {
  const {
    viewer: {
      instance,
      metadata: { filteringState }
    }
  } = useInjectedViewerState()

  return () => {
    const res = instance.query<IntersectionQuery>({
      point: { x: 0, y: 0 },
      operation: 'Pick'
    })
    const obj = (res?.objects || []).find((o) => {
      const oid = o.object?.id as Optional<string>
      if (!oid) return false

      const hasHiddenObjects = (filteringState.value?.hiddenObjects || []).length !== 0
      const hasIsolatedObjects =
        !!filteringState.value?.isolatedObjects &&
        filteringState.value?.isolatedObjects.length !== 0

      if (hasHiddenObjects && filteringState.value?.hiddenObjects?.includes(oid))
        return false
      if (hasIsolatedObjects && !filteringState.value?.isolatedObjects?.includes(oid))
        return false

      return true
    })

    return obj ? (obj.object?.id as string) : null
  }
}
