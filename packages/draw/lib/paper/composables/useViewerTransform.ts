import type { Shape } from '../../../lib/paper'

/**
 * Calculate the initial width/height ratio of the shape when created
 */
const shapeInitialRatio = (shape: Shape) =>
  shape.containerWidthOnCreate / shape.containerHeightOnCreate

/**
 * Calculate the vertical offset based on the difference between
 * the current paper height and the height at creation time
 */
export const offsetY = (shape: Shape) =>
  (shape.currentContainerHeight - shape.containerHeightOnCreate) / 2

/**
 * Calculate the horizontal offset.
 * Since we scale the viewer only on height change, we need to
 * subtract the scaled offset according to the initial w/h ratio.
 */
export const offsetX = (shape: Shape) =>
  (shape.currentContainerWidth - shape.containerWidthOnCreate) / 2 -
  offsetY(shape) * shapeInitialRatio(shape)

/**
 * Calculate the scale factor applied to both x and y directions.
 */
export const scale = (shape: Shape) =>
  shape.currentContainerHeight / shape.containerHeightOnCreate
