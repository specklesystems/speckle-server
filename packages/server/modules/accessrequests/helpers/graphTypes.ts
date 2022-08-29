import { StreamAccessRequest } from '@/modules/core/graph/generated/graphql'

export type StreamAccessRequestGraphQLReturn = Omit<
  StreamAccessRequest,
  'requester' | 'stream'
>
