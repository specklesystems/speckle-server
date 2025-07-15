declare module 'troika-three-text' {
  import { Mesh, Material, DataTexture, Color } from 'three'

  export type AnchorY = 'middle' | 'top' | 'bottom'
  export type AnchorX = 'center' | 'left' | 'right' | 'justify'

  export class Text extends Mesh {
    text: string
    fontSize: number
    font: string
    color: string | number | Color
    anchorX: AnchorX
    anchorY: AnchorY
    maxWidth?: number
    outlineWidth?: number
    outlineColor?: string | number | Color
    outlineOpacity?: number
    fillOpacity?: number
    letterSpacing?: number
    lineHeight?: number
    curveRadius?: number
    depthOffset?: number
    direction?: 'ltr' | 'rtl'
    _needsSync: boolean
    get textRenderInfo()

    constructor()

    clone(recursive?: boolean): this
    copy(source: this, recursive?: boolean): this
    dispose(): void
    sync(callback?: () => void): void
    raycast(...args: unknown[]): void
    onBeforeRender(...args: unknown[]): void
    onAfterRender(...args: unknown[]): void
    localPositionToTextCoords(...args: unknown[]): void
    worldPositionToTextCoords(...args: unknown[]): void
    _prepareForRender(material: Material)

    static DefaultMatrixAutoUpdate: boolean
    static DefaultMatrixWorldAutoUpdate: boolean
  }

  export class BatchedText extends Text {
    _members: Map<
      Text,
      {
        index: -1
        glyphCount: -1
        dirty: true
        needsUpdate?: boolean
      }
    >
    addText(text: Text): void
    _dataTextures: Record<'outline' | 'main', DataTexture>
    _onMemberSynced: (e) => void
    removeText(text: Text): void
    createDerivedMaterial(baseMaterial: Material): Material
    updateMatrixWorld(force: boolean): void
    updateBounds(): void
    sync(callback?: () => void): void
    copy(source: BatchedText): BatchedText
    dispose(): void
  }
}
