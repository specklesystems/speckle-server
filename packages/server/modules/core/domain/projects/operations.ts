import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { StreamRoles } from '@speckle/shared'

export type UpsertProjectRole = (args: {
  projectId: string
  userId: string
  role: StreamRoles
}) => Promise<StreamRecord>

export type DeleteProjectRole = (args: {
  projectId: string
  userId: string
}) => Promise<StreamRecord | undefined>

export type GetRolesByUserId = ({
  userId,
  workspaceId
}: {
  userId: string
  workspaceId?: string
}) => Promise<Pick<StreamAclRecord, 'role' | 'resourceId'>[]>
