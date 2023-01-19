import { MaybeAsync, Nullable } from '@speckle/shared'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { RedisPubSub } from 'graphql-redis-subscriptions'
import Redis from 'ioredis'
import { withFilter } from 'graphql-subscriptions'
import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import {
  ProjectModelsUpdatedMessage,
  ProjectUpdatedMessage,
  ProjectVersionsUpdatedMessage,
  SubscriptionProjectModelsUpdatedArgs,
  SubscriptionProjectUpdatedArgs,
  SubscriptionProjectVersionsUpdatedArgs,
  SubscriptionSubscribeFn,
  UserProjectsUpdatedMessage
} from '@/modules/core/graph/generated/graphql'
import { Merge } from 'type-fest'
import {
  ModelGraphQLReturn,
  ProjectGraphQLReturn,
  VersionGraphQLReturn
} from '@/modules/core/helpers/graphTypes'

/**
 * GraphQL Subscription PubSub instance
 */
export const pubsub = new RedisPubSub({
  publisher: new Redis(getRedisUrl()),
  subscriber: new Redis(getRedisUrl())
})

/**
 * Subscription event keys
 */

export enum StreamSubscriptions {
  UserStreamAdded = 'USER_STREAM_ADDED',
  UserStreamRemoved = 'USER_STREAM_REMOVED',
  StreamUpdated = 'STREAM_UPDATED',
  StreamDeleted = 'STREAM_DELETED'
}

export enum CommitSubscriptions {
  CommitCreated = 'COMMIT_CREATED',
  CommitUpdated = 'COMMIT_UPDATED',
  CommitDeleted = 'COMMIT_DELETED'
}

export enum BranchSubscriptions {
  BranchCreated = 'BRANCH_CREATED',
  BranchUpdated = 'BRANCH_UPDATED',
  BranchDeleted = 'BRANCH_DELETED'
}

export enum UserSubscriptions {
  UserProjectsUpdated = 'USER_PROJECTS_UPDATED'
}

export enum ProjectSubscriptions {
  ProjectUpdated = 'PROJECT_UPDATED',
  ProjectModelsUpdated = 'PROJECT_MODELS_UPDATED',
  ProjectVersionsUpdated = 'PROJECT_VERSIONS_UPDATED'
}

type NoVariables = Record<string, never>

// Add mappings between expected event constant, its payload and variables
type SubscriptionTypeMap = {
  [UserSubscriptions.UserProjectsUpdated]: {
    payload: {
      userProjectsUpdated: Merge<
        UserProjectsUpdatedMessage,
        { project: Nullable<ProjectGraphQLReturn> }
      >
      ownerId: string
    }
    variables: NoVariables
  }
  [ProjectSubscriptions.ProjectUpdated]: {
    payload: {
      projectUpdated: Merge<
        ProjectUpdatedMessage,
        { project: Nullable<ProjectGraphQLReturn> }
      >
    }
    variables: SubscriptionProjectUpdatedArgs
  }
  [ProjectSubscriptions.ProjectModelsUpdated]: {
    payload: {
      projectModelsUpdated: Merge<
        ProjectModelsUpdatedMessage,
        { model: Nullable<ModelGraphQLReturn> }
      >
      projectId: string
    }
    variables: SubscriptionProjectModelsUpdatedArgs
  }
  [ProjectSubscriptions.ProjectVersionsUpdated]: {
    payload: {
      projectVersionsUpdated: Merge<
        ProjectVersionsUpdatedMessage,
        { version: Nullable<VersionGraphQLReturn> }
      >
      projectId: string
    }
    variables: SubscriptionProjectVersionsUpdatedArgs
  }
} & { [k in SubscriptionEvent]: { payload: unknown; variables: unknown } }

type SubscriptionEvent = UserSubscriptions | ProjectSubscriptions

/**
 * Publish a GQL subscription event
 */
export const publish = <T extends SubscriptionEvent>(
  event: T,
  payload: SubscriptionTypeMap[T]['payload']
) => pubsub.publish(event, payload)

/**
 * Subscribe to a GQL subscription and use the filter function to filter subscribers
 * depending on the payload, variables and/or GQL context
 */
export const filteredSubscribe = <T extends SubscriptionEvent>(
  event: T,
  filterFn: (
    payload: SubscriptionTypeMap[T]['payload'],
    variables: SubscriptionTypeMap[T]['variables'],
    context: GraphQLContext
  ) => MaybeAsync<boolean>
) => {
  // we need to cast to graphql codegen types cause they're not fully compatible
  // with our version of graphql-subscriptions
  // https://github.com/dotansimha/graphql-code-generator/issues/7197#issuecomment-1098014584
  return withFilter(
    () => pubsub.asyncIterator([event]),
    filterFn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as unknown as SubscriptionSubscribeFn<any, any, any, any>
}
