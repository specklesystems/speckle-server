import type { StringEnumValues } from '@speckle/shared'
import { StringEnum } from '@speckle/shared'

export const ImporterAutomateFunctions = {
  svf2: {
    functionId: '4665e0b3ba',
    functionReleaseId: '470ec84b63'
  },
  rvt: {
    functionId: '0659f470f5',
    functionReleaseId: 'ffb6e03aa7'
  }
}

export const AccSyncItemStatuses = StringEnum([
  // A new file version had been detected, and we are awaiting a processable file.
  'pending',
  // We are actively processing the new file version. (The Automate function has been triggered.)
  'syncing',
  'failed',
  'paused',
  'succeeded'
])
export type AccSyncItemStatus = StringEnumValues<typeof AccSyncItemStatuses>

export const AccRegions = StringEnum([
  'US',
  'EMEA',
  'AUS',
  'CAN',
  'DEU',
  'IND',
  'JPN',
  'GBR'
])
export type AccRegion = StringEnumValues<typeof AccRegions>
