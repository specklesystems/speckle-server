import { WorkerMessageType } from './WorkerMessageType.js'

export interface InitQueuesMessage {
  name: string
  type: WorkerMessageType
  mainToWorkerSab: SharedArrayBuffer
  mainToWorkerCapacityBytes: number
  workerToMainSab: SharedArrayBuffer
  workerToMainCapacityBytes: number
}
