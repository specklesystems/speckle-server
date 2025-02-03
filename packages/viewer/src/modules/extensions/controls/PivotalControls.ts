// import { PerspectiveCamera, OrthographicCamera, Sphere, Vector3 } from 'three'
// import { SpeckleControls } from './SpeckleControls.js'

// export interface PivotalControlsOptions {}

// export class PivotalControls extends SpeckleControls {
//   private _enabled: boolean = false
//   private _options: Required<PivotalControlsOptions> = {}

//   get options(): Partial<PivotalControlsOptions> {
//     return this._options
//   }
//   set options(value: Partial<PivotalControlsOptions>) {
//     Object.assign(this._options, value)
//   }

//   get enabled(): boolean {
//     return this._enabled
//   }
//   set enabled(value: boolean) {
//     this._enabled = value
//   }

//   set targetCamera(target: PerspectiveCamera | OrthographicCamera) {
//     throw new Error('Method not implemented.')
//   }

//   isStationary(): boolean {
//     throw new Error('Method not implemented.')
//   }

//   update(delta?: number): boolean {
//     throw new Error('Method not implemented.')
//   }
//   jumpToGoal(): void {
//     throw new Error('Method not implemented.')
//   }
//   fitToSphere(sphere: Sphere): void {
//     throw new Error('Method not implemented.')
//   }
//   dispose(): void {
//     throw new Error('Method not implemented.')
//   }
//   fromPositionAndTarget(position: Vector3, target: Vector3): void {
//     throw new Error('Method not implemented.')
//   }
//   getTarget(): Vector3 {
//     throw new Error('Method not implemented.')
//   }
//   getPosition(): Vector3 {
//     throw new Error('Method not implemented.')
//   }
// }
