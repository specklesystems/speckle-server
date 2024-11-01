import { ProjectTeamMember } from '@/modules/core/domain/projects/types'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { StreamRoles } from '@speckle/shared'

export type GetProject = (args: { projectId: string }) => Promise<StreamRecord>

export type GetProjectCollaborators = (args: {
  projectId: string
}) => Promise<ProjectTeamMember[]>

export type UpdateProject = (args: {
  projectUpdate: Pick<StreamRecord, 'id' | 'workspaceId'>
}) => Promise<StreamRecord>

export type UpsertProjectRole = (
  args: {
    projectId: string
    userId: string
    role: StreamRoles
  },
  options?: { trackProjectUpdate?: boolean }
) => Promise<StreamRecord>

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
