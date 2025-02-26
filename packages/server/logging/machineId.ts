'use strict'

import { machineIdSync } from 'node-machine-id'
import { v4 as uuidv4 } from 'uuid'

export const getMachineId = () => {
  try {
    const deviceId = machineIdSync()
    return deviceId
  } catch {
    const deviceId = uuidv4()
    return deviceId
  }
}
