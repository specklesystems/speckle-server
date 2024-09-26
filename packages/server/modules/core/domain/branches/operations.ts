import { Branch } from '@/modules/core/domain/branches/types'
import { Optional } from '@speckle/shared'

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
