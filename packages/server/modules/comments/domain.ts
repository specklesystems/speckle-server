import type { Optional } from '@/modules/shared/helpers/typeHelper'
import type { ExtendedComment } from "@/modules/comments/repositories/comments";
import type { Dictionary } from 'lodash';
import { ResourceIdentifier } from '@/test/graphql/generated/graphql';

export interface CommentsRepository {
  getComment: (params: { id: string, userId?: string }) => Promise<Optional<ExtendedComment>>
  getCommentsResources: (commentIds: string[]) => Promise<Dictionary<{ commentId: string, resources: ResourceIdentifier[] }>>
}