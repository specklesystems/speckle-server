import { Branch } from '@/modules/core/domain/branches/types'
import { BranchLatestCommit } from '@/modules/core/domain/commits/types'
import { Nullable, Optional } from '@speckle/shared'

export type GenerateBranchId = () => string

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
