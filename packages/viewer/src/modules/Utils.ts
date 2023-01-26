export interface Utils {
  screenToNDC(x: number, y: number, width?: number, height?: number)
  NDCToScreen(x: number, y: number, width?: number, height?: number)
}
