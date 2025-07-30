export const ImporterAutomateFunctions = {
  svf2: {
    functionId: '2909d29a9d',
    functionReleaseId: 'eeff138439'
  }
}

export const AccSyncItemStatuses = {
  // A new file version had been detected, and we are awaiting a processable file.
  pending: 'PENDING',
  // We are actively processing the new file version. (The Automate function has been triggered.)
  syncing: 'SYNCING',
  failed: 'FAILED',
  paused: 'PAUSED',
  succeeded: 'SUCCEEDED'
} as const
export type AccSyncItemStatus =
  (typeof AccSyncItemStatuses)[keyof typeof AccSyncItemStatuses]

export const AccRegions = {
  US: 'US',
  EMEA: 'EMEA',
  AUS: 'AUS',
  CAN: 'CAN',
  DEU: 'DEU',
  IND: 'IND',
  JPN: 'JPN',
  GBR: 'GBR'
}
export type AccRegion = (typeof AccRegions)[keyof typeof AccRegions]
