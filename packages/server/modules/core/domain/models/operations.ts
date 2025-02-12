import { Model } from '@/modules/core/domain/branches/types'

export type GetModelById = (input: { id: string }) => Promise<Model | undefined>
