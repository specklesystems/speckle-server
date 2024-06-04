export abstract class SpeckleControls {
  abstract isStationary(): boolean
  abstract update(delta?: number): boolean
}
