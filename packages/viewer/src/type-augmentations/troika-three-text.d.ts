import { Text } from 'troika-three-text'
import { Material } from 'three'
import SpeckleTextMaterial from '../modules/materials/SpeckleTextMaterial.ts'

declare module 'troika-three-text' {
  interface BatchedText {
    addText(text: Text): void
    removeText(text: Text): void
    createDerivedMaterial(baseMaterial: Material): SpeckleTextMaterial
    updateMatrixWorld(force): void
    updateBounds(): void
    sync(callback: () => void): void
    copy(source: BatchedText): BatchedText
    dispose(): void
  }
}
export {}
