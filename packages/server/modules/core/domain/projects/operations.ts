import type {
  Project,
  StreamWithOptionalRole
} from '@/modules/core/domain/streams/types'
import type { StreamAclRecord, StreamRecord } from '@/modules/core/helpers/types'
import type {
  MaybeNullOrUndefined,
  Nullable,
  NullableKeysToOptional,
  StreamRoles
} from '@speckle/shared'

export type GetProject = (args: { projectId: string }) => Promise<Project | null>

export type UpdateProject = (args: {
  projectUpdate: Pick<StreamRecord, 'id'> & Partial<StreamRecord> & { updatedAt: Date }
}) => Promise<StreamRecord>

export type StoreProjectRole = (args: {
  projectId: string
  userId: string
  role: StreamRoles
}) => Promise<void>

export type StoreProjectRoles = (args: {
  roles: {
    projectId: string
    userId: string
    role: StreamRoles
  }[]
}) => Promise<void>

export type UpsertProjectRole = (args: {
  projectId: string
  userId: string
  role: StreamRoles
}) => Promise<StreamRecord>

export type BulkUpsertProjects = (params: {
  projects: Array<NullableKeysToOptional<StreamRecord>>
}) => Promise<void>

export type GetAllProjects = (args: {
  limit: number
  regionKey: string
  cursor: Nullable<string>
}) => Promise<{
  items: StreamRecord[]
  cursor: Nullable<string>
}>

export type DeleteProject = (args: { projectId: string }) => Promise<void>
export type DeleteProjectAndCommits = (args: { projectId: string }) => Promise<void>

export type GetUserProjectRoles = ({
  userId,
  workspaceId
}: {
  userId: string
  workspaceId?: string
}) => Promise<Pick<StreamAclRecord, 'role' | 'resourceId'>[]>

export type ProjectVisibility = 'PRIVATE' | 'PUBLIC' | 'UNLISTED' | 'WORKSPACE'

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

export type WaitForRegionProject = (params: {
  projectId: string
  regionKey: string
  maxAttempts?: number
}) => Promise<void>

export type QueryAllProjects = (
  args:
    | {
        userId: string
        workspaceId?: string
      }
    | {
        userId?: string
        workspaceId: string
      }
) => AsyncGenerator<StreamWithOptionalRole[], void, unknown>
