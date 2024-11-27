export enum WorkStatus {
  SUCCESS = 'SUCCESS',
  NOWORKFOUND = 'NOWORKFOUND',
  FAILED = 'FAILED'
}

export type WorkToBeDone = () => Promise<WorkStatus>
