import { ProjectTeamMember } from '@/modules/core/domain/projects/types'
import { Project } from '@/modules/core/domain/streams/types'
import { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import { MaybeNullOrUndefined, StreamRoles } from '@speckle/shared'

export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type GetProjectCollaborators = (args: {
  projectId: string
}) => Promise<ProjectTeamMember[]>

export type UpdateProject = (args: {
  projectUpdate: Pick<StreamRecord, 'id' | 'workspaceId'>
}) => Promise<StreamRecord>

export type StoreProjectRole = (args: {
  projectId: string
  userId: string
  role: StreamRoles
}) => Promise<void>

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

export type DeleteProject = (args: { projectId: string }) => Promise<void>

export type GetRolesByUserId = ({
  userId,
  workspaceId
}: {
  userId: string
  workspaceId?: string
}) => Promise<Pick<StreamAclRecord, 'role' | 'resourceId'>[]>

export type ProjectVisibility = 'PRIVATE' | 'PUBLIC' | 'UNLISTED'

export type ProjectCreateArgs = {
  description?: MaybeNullOrUndefined<string>
  name?: MaybeNullOrUndefined<string>
  visibility?: MaybeNullOrUndefined<ProjectVisibility>
  regionKey?: MaybeNullOrUndefined<string>
  workspaceId?: MaybeNullOrUndefined<string>
  ownerId: string
}

export type CreateProject = (params: ProjectCreateArgs) => Promise<Project>

export type StoreProject = (params: { project: Project }) => Promise<void>

export type StoreModel = (params: {
  name: string
  description: string | null
  projectId: string
  authorId: string
}) => Promise<void>
