/**
 * Maps internal webhook trigger names to user-friendly display names.
 * This maintains the snake_case format but updates terminology:
 * - 'stream' -> 'project'
 * - 'branch' -> 'model'
 * - 'commit' -> 'version'
 * The original trigger values are preserved for functionality.
 */
import { WebhookTriggers } from '@speckle/shared'

export const webhookTriggerDisplayNames: Record<
  (typeof WebhookTriggers)[keyof typeof WebhookTriggers],
  string
> = {
  [WebhookTriggers.StreamUpdate]: 'project_update',
  [WebhookTriggers.StreamDelete]: 'project_delete',
  [WebhookTriggers.BranchCreate]: 'model_create',
  [WebhookTriggers.BranchUpdate]: 'model_update',
  [WebhookTriggers.BranchDelete]: 'model_delete',
  [WebhookTriggers.CommitCreate]: 'version_create',
  [WebhookTriggers.CommitUpdate]: 'version_update',
  [WebhookTriggers.CommitReceive]: 'version_receive',
  [WebhookTriggers.CommitDelete]: 'version_delete',
  [WebhookTriggers.CommentCreated]: 'comment_created',
  [WebhookTriggers.CommentArchived]: 'comment_archived',
  [WebhookTriggers.CommentReplied]: 'comment_replied',
  [WebhookTriggers.StreamPermissionsAdd]: 'project_permissions_add',
  [WebhookTriggers.StreamPermissionsRemove]: 'project_permissions_remove'
}
