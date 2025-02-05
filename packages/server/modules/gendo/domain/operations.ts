import { GendoAiRenderInput } from '@/modules/core/graph/generated/graphql'
import { GendoAIRender, UserCredits } from '@/modules/gendo/domain/types'
import { NullableKeysToOptional, Optional } from '@speckle/shared'
import { SetOptional } from 'type-fest'

export type StoreRender = (
  input: NullableKeysToOptional<SetOptional<GendoAIRender, 'createdAt' | 'updatedAt'>>
) => Promise<GendoAIRender>

export type GetRenderByGenerationId = (params: {
  gendoGenerationId: string
}) => Promise<Optional<GendoAIRender>>

export type GetLatestVersionRenderRequests = (params: {
  versionId: string
}) => Promise<GendoAIRender[]>

export type GetVersionRenderRequest = (params: {
  versionId: string
  id: string
}) => Promise<Optional<GendoAIRender>>

export type UpdateRenderRecord = (params: {
  input: Partial<GendoAIRender>
  id: string
}) => Promise<GendoAIRender>

export type CreateRenderRequest = (
  input: GendoAiRenderInput & {
    userId: string
  }
) => Promise<GendoAIRender>

export type UpdateRenderRequest = (input: {
  responseImage: string
  status: string
  gendoGenerationId: string
}) => Promise<GendoAIRender>

export type RequestNewImageGeneration = (args: {
  userId: string
  baseImage: string
  projectId: string
  prompt: string
}) => Promise<{ status: string; generationId: string }>

export type GetUserCredits = (args: { userId: string }) => Promise<UserCredits | null>
export type UpsertUserCredits = (args: { userCredits: UserCredits }) => Promise<void>
