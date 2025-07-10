import { WorkerMessageType } from './WorkerMessageType.js'

export interface InitQueuesMessage {
  type: WorkerMessageType
  mainToWorkerSab: SharedArrayBuffer
  mainToWorkerCapacityBytes: number
  workerToMainSab: SharedArrayBuffer
  workerToMainCapacityBytes: number
}
