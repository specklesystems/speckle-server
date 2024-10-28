import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { GendoAIRender } from '@/modules/gendo/domain/types'
import { NullableKeysToOptional } from '@speckle/shared'
import { SetOptional } from 'type-fest'

export type StoreRender = (
  input: NullableKeysToOptional<SetOptional<GendoAIRender, 'createdAt' | 'updatedAt'>>
) => Promise<GendoAIRender>

export type CreateRenderRequest = (
  input: GendoAiRenderInput & {
    userId: string
  }
) => Promise<GendoAIRender>
