import { Branch, ModelTreeItem } from '@/modules/core/domain/branches/types'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'
import {
  BranchCreateInput,
  BranchDeleteInput,
  BranchUpdateInput,
  CreateModelInput,
  DeleteModelInput,
  ModelsTreeItemCollection,
  ProjectModelsArgs,
  ProjectModelsTreeArgs,
  StreamBranchesArgs,
  UpdateModelInput
} from '@/modules/core/graph/generated/graphql'
import { ModelsTreeItemGraphQLReturn } from '@/modules/core/helpers/graphTypes'
import { BatchedSelectOptions } from '@/modules/shared/helpers/dbHelper'
import { MaybeNullOrUndefined, Nullable, Optional } from '@speckle/shared'
import { Knex } from 'knex'
import { Merge } from 'type-fest'

export type GenerateBranchId = () => string

export type GetBatchedStreamBranches = (
  streamId: string,
  options?: Partial<BatchedSelectOptions>
) => AsyncGenerator<Branch[], void, unknown>

export type InsertBranches = (
  branches: Branch[],
  options?: Partial<{
    trx: Knex.Transaction
  }>
) => Promise<number[]>

export type GetBranchesByIds = (
  branchIds: string[],
  options?: Partial<{
    streamId: string
  }>
) => Promise<Branch[]>

export type GetBranchById = (
  branchId: string,
  options?: Partial<{
    streamId: string
  }>
) => Promise<Optional<Branch>>

export type GetStreamBranchesByName = (
  streamId: string,
  names: string[],
  options?: Partial<{
    startsWithName: boolean
  }>
) => Promise<Branch[]>

export type GetStreamBranchByName = (
  streamId: string,
  name: string
) => Promise<Nullable<Branch>>

export type GetBranchLatestCommits = (
  branchIds?: string[],
  streamId?: string,
  options?: Partial<{
    limit: number
  }>
) => Promise<BranchLatestCommit[]>

export type GetStructuredProjectModels = (projectId: string) => Promise<ModelTreeItem>

export type GetPaginatedProjectModelsItems = (
  projectId: string,
  params: ProjectModelsArgs
) => Promise<{
  items: Branch[]
  cursor: string | null
}>

export type GetPaginatedProjectModelsTotalCount = (
  projectId: string,
  params: ProjectModelsArgs
) => Promise<number>

export type GetPaginatedProjectModels = (
  projectId: string,
  params: ProjectModelsArgs
) => Promise<{
  totalCount: number
  items: Branch[]
  cursor: string | null
}>

export type GetModelTreeItemsFiltered = (
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{
    filterOutEmptyMain: boolean
  }>
) => Promise<ModelsTreeItemGraphQLReturn[]>

export type GetModelTreeItemsFilteredTotalCount = (
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{
    filterOutEmptyMain: boolean
  }>
) => Promise<number>

export type GetProjectTopLevelModelsTree = (
  projectId: string,
  args: ProjectModelsTreeArgs,
  options?: Partial<{
    filterOutEmptyMain: boolean
  }>
) => Promise<
  Merge<
    ModelsTreeItemCollection,
    {
      items: ModelsTreeItemGraphQLReturn[]
    }
  >
>

export type GetModelTreeItems = (
  projectId: string,
  args: Omit<ProjectModelsTreeArgs, 'filter'>,
  options?: Partial<{
    filterOutEmptyMain: boolean
    parentModelName: string
  }>
) => Promise<ModelsTreeItemGraphQLReturn[]>

export type GetModelTreeItemsTotalCount = (
  projectId: string,
  options?: Partial<{
    filterOutEmptyMain: boolean
    parentModelName: string
  }>
) => Promise<number>

export type StoreBranch = (params: {
  name: string
  description: string | null
  streamId: string
  authorId: string
}) => Promise<Branch>

export type CreateBranchAndNotify = (
  input: BranchCreateInput | CreateModelInput,
  creatorId: string
) => Promise<Branch>

export type UpdateBranch = (
  branchId: string,
  branch: Partial<Branch>
) => Promise<Branch>

export type DeleteBranchById = (branchId: string) => Promise<number>

export type UpdateBranchAndNotify = (
  input: BranchUpdateInput | UpdateModelInput,
  userId: string
) => Promise<Branch>

export type DeleteBranchAndNotify = (
  input: BranchDeleteInput | DeleteModelInput,
  userId: string
) => Promise<boolean>

export type GetStreamBranchCounts = (
  streamIds: string[],
  options?: Partial<{
    skipEmptyMain: boolean
  }>
) => Promise<Array<{ count: number; streamId: string }>>

export type GetStreamBranchCount = (
  streamId: string,
  options?: Partial<{
    skipEmptyMain: boolean
  }>
) => Promise<number>

export type GetPaginatedStreamBranchesPage = (params: {
  streamId: string
  limit?: MaybeNullOrUndefined<number>
  cursor?: MaybeNullOrUndefined<string>
}) => Promise<{
  items: Branch[]
  cursor: string | null
}>

export type GetBranchCommitCounts = (branchIds: string[]) => Promise<
  {
    count: number
    id: string
  }[]
>

export type GetBranchCommitCount = (branchId: string) => Promise<number>

export type MarkCommitBranchUpdated = (commitId: string) => Promise<Branch>

export type GetLatestStreamBranch = (streamId: string) => Promise<Branch>

export type GetPaginatedStreamBranches = (
  streamId: string,
  params?: StreamBranchesArgs
) => Promise<{
  totalCount: number
  cursor?: MaybeNullOrUndefined<string>
  items: Branch[]
}>
