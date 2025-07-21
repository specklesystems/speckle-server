import SpeckleTextMaterial from './SpeckleTextMaterial.js'

class SpeckleTextColoredMaterial extends SpeckleTextMaterial {
  public gradientIndexMap: { [index: number]: number } = {}

  public updateGradientIndexMap(index: number, value: number) {
    this.gradientIndexMap[index] = value
  }
}

export default SpeckleTextColoredMaterial
