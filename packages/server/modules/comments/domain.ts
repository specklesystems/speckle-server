import type { Optional } from '@/modules/shared/helpers/typeHelper'
import type { ExtendedComment } from "@/modules/comments/repositories/comments";

export interface CommentsRepository {
  getComment: (params: { id: string, userId?: string }) => Promise<Optional<ExtendedComment>>
}