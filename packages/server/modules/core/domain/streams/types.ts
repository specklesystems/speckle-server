import { StreamRecord } from '@/modules/core/helpers/types'
import { StreamRoles } from '@speckle/shared'

export type Stream = StreamRecord
export type Project = Stream

export type StreamWithOptionalRole = Stream & {
  /**
   * Available, if query joined this data StreamAcl
   */
  role?: StreamRoles
}
