export interface Utils {
  screenToNDC(
    x: number,
    y: number,
    width?: number,
    height?: number
  ): { x: number; y: number }
  NDCToScreen(
    x: number,
    y: number,
    width?: number,
    height?: number
  ): { x: number; y: number }
}
