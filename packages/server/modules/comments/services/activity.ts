/**
 * I'm leaving this in for now so that it appears somewhere in git history and we can get it back, if we want to.
 * The idea behind this was to allow for crossover between new and old viewer subscriptions & mutations.
 */
// import { Nullable, SpeckleViewer } from '@speckle/shared'
// import {
//   MutationBroadcastViewerUserActivityArgs,
//   MutationUserCommentThreadActivityBroadcastArgs,
//   MutationUserViewerActivityBroadcastArgs,
//   ResourceType,
//   ViewerUserActivityStatus
// } from '@/modules/core/graph/generated/graphql'
// import { getViewerResourceGroups } from '@/modules/core/services/commit/viewerResources'
// import { flatten, get, keyBy, reduce, uniq } from 'lodash'
// import { getCommitBranch, getCommitBranches } from '@/modules/core/repositories/commits'
// import { Merge } from 'type-fest'
// import { getCommentsResources } from '@/modules/comments/repositories/comments'

// type SectionBox = {
//   min: { x: number; y: number; z: number }
//   max: { x: number; y: number; z: number }
// }

// type OldFilterState = {
//   hiddenIds?: string[]
//   isolatedIds?: string[]
//   propertyInfoKey?: string
//   passMin?: number | null
//   passMax?: number | null
//   sectionBox?: number[]
// }

// type FilteringState = {
//   selectedObjects?: string[]
//   hiddenObjects?: string[]
//   isolatedObjects?: string[]
//   colorGroups?: Record<string, string>[]
//   userColorGroups?: {
//     ids: string[]
//     color: string
//   }[]
//   activePropFilterKey?: string
//   passMin?: number | null
//   passMax?: number | null
// }

// type AnyObject = Record<string, unknown>

// type OldActivityArgs = Merge<
//   MutationUserViewerActivityBroadcastArgs,
//   {
//     data:
//       | {
//           filter: OldFilterState
//           selection: string[]
//           selectionLocation: Nullable<AnyObject>
//           sectionBox: Nullable<AnyObject>
//           selectionCenter: Nullable<AnyObject>
//           camera: Array<string | number>
//           userId: Nullable<string>
//           name: string
//           uuid: string
//           status: 'viewing'
//         }
//       | {
//           userId: Nullable<string>
//           uuid: string
//           status: 'disconnect'
//         }
//   }
// >

// type OldTypingArgs = Merge<
//   MutationUserCommentThreadActivityBroadcastArgs,
//   {
//     data: {
//       userId: Nullable<string>
//       userName: string
//       isTyping: boolean
//     }
//   }
// >

// /**
//  * MUTATIONS:
//  *  - broadcastViewerUserActivity: trigger viewerUserActivityBroadcasted / userViewerActivity, commentThreadActivity
//  *  - userViewerActivityBroadcast: trigger userViewerActivity / viewerUserActivityBroadcasted
//  * - userCommentThreadActivityBroadcast: trigger commentThreadActivity / viewerUserActivityBroadcasted
//  *
//  * SUBSCRIPTIONS:
//  * - viewerUserActivityBroadcasted: triggered by all 3 mutations
//  * - projectCommentsUpdated: triggered by same as commentActivity & commentThreadActivity
//  * - userViewerActivity: triggered by 1.,2. mutations
//  * - commentActivity: triggered by existing method
//  * - commentThreadActivity: triggered by existing method + broadcastViewerUserActivity
//  */

// function filteringStateToOldFilterState(
//   filteringState?: FilteringState,
//   sectionBox?: SectionBox | null | undefined
// ): OldFilterState {
//   return {
//     hiddenIds: filteringState?.hiddenObjects || [],
//     isolatedIds: filteringState?.isolatedObjects || [],
//     propertyInfoKey: filteringState?.activePropFilterKey,
//     passMin: filteringState?.passMin,
//     passMax: filteringState?.passMax,
//     sectionBox: sectionBox
//       ? [
//           +sectionBox.min.x.toFixed(2),
//           +sectionBox.min.y.toFixed(2),
//           +sectionBox.min.z.toFixed(2),
//           +sectionBox.max.x.toFixed(2),
//           +sectionBox.max.y.toFixed(2),
//           +sectionBox.max.z.toFixed(2)
//         ]
//       : undefined
//   }
// }

// function oldFilterStateToFilteringState(
//   state: OldFilterState,
//   selectedObjects?: string[]
// ): FilteringState {
//   return {
//     selectedObjects,
//     hiddenObjects: state.hiddenIds,
//     isolatedObjects: state.isolatedIds,
//     colorGroups: undefined,
//     userColorGroups: undefined,
//     activePropFilterKey: state.propertyInfoKey,
//     passMin: state.passMin,
//     passMax: state.passMax
//   }
// }

// /**
//  * Get all commit & object ids from resourceIdString
//  */
// async function getOldResourceIds(
//   projectId: string,
//   resourceIdString: string
// ): Promise<string[]> {
//   const groups = await getViewerResourceGroups(projectId, resourceIdString)
//   const ids = reduce(
//     groups,
//     (results, group) => {
//       const groupIds = flatten(
//         group.items.map((i) => [i.objectId, i.versionId])
//       ).filter((id): id is NonNullable<typeof id> => !!id)
//       for (const groupId of groupIds) {
//         results.push(groupId)
//       }
//       return results
//     },
//     [] as string[]
//   )

//   return uniq(ids)
// }

// async function oldResourceIdToResourceIdString(
//   resourceId: string
// ): Promise<Nullable<string>> {
//   if (resourceId.length !== 10) {
//     return SpeckleViewer.ViewerRoute.createGetParamFromResources(
//       SpeckleViewer.ViewerRoute.resourceBuilder().addObject(resourceId).toResources()
//     )
//   }

//   const branch = await getCommitBranch(resourceId)
//   if (!branch) return null

//   return SpeckleViewer.ViewerRoute.createGetParamFromResources(
//     SpeckleViewer.ViewerRoute.resourceBuilder()
//       .addModel(branch.id, resourceId)
//       .toResources()
//   )
// }

// // utilities for converting mutations back n forth for backwards compatibility

// export async function convertNewActivityToOldActivities(
//   args: MutationBroadcastViewerUserActivityArgs,
//   userId: string
// ): Promise<OldActivityArgs[]> {
//   const resourceIds = await getOldResourceIds(args.projectId, args.resourceIdString)
//   const isDisconnecting = args.message.status === ViewerUserActivityStatus.Disconnected
//   const selection = args.message.selection
//   if (!isDisconnecting && !selection) return []

//   return resourceIds.map(
//     (id): OldActivityArgs => ({
//       resourceId: id,
//       streamId: args.projectId,
//       data:
//         isDisconnecting || !selection
//           ? {
//               userId,
//               uuid: args.message.viewerSessionId,
//               status: 'disconnect'
//             }
//           : {
//               filter: filteringStateToOldFilterState(
//                 selection.filteringState,
//                 (selection.sectionBox || null) as Nullable<SectionBox>
//               ),
//               selection:
//                 (selection.filteringState as Nullable<FilteringState>)
//                   ?.selectedObjects || [],
//               selectionLocation: selection.selectionLocation || null,
//               selectionCenter: selection.selectionCenter || null,
//               sectionBox: selection.sectionBox || null,
//               camera: selection.camera as unknown as Array<string | number>,
//               userId: args.message.userId || null,
//               name: args.message.userName,
//               uuid: args.message.viewerSessionId,
//               status: 'viewing'
//             }
//     })
//   )
// }

// export function convertNewActivityToOldTyping(
//   args: MutationBroadcastViewerUserActivityArgs
// ): Nullable<OldTypingArgs> {
//   const isTyping = args.message.status === ViewerUserActivityStatus.Typing
//   const typing = args.message.typing
//   if (!isTyping || !typing) return null

//   return {
//     commentId: typing.threadId,
//     streamId: args.projectId,
//     data: {
//       userId: args.message.userId || null,
//       userName: args.message.userName,
//       isTyping: typing.isTyping
//     }
//   }
// }

// export async function convertOldActivityToNewActivity(
//   args: OldActivityArgs
// ): Promise<Nullable<MutationBroadcastViewerUserActivityArgs>> {
//   const resourceIdString = await oldResourceIdToResourceIdString(args.resourceId)
//   if (!resourceIdString) return null

//   return {
//     projectId: args.streamId,
//     resourceIdString,
//     message: {
//       userName: get(args.data, 'name') || 'Unknown',
//       userId: args.data.userId || null,
//       viewerSessionId: args.data.uuid,
//       status:
//         args.data.status === 'disconnect'
//           ? ViewerUserActivityStatus.Disconnected
//           : ViewerUserActivityStatus.Viewing,
//       selection:
//         args.data.status === 'disconnect'
//           ? null
//           : {
//               filteringState: oldFilterStateToFilteringState(
//                 args.data.filter as OldFilterState
//               ),
//               selectionLocation: args.data.selectionLocation || null,
//               selectionCenter: args.data.selectionCenter || null,
//               sectionBox: args.data.sectionBox || null,
//               camera: args.data.camera as unknown as Record<string, unknown>
//             },
//       typing: null
//     }
//   }
// }

// export async function convertOldCommentThreadActivityToNewActivity(
//   args: OldTypingArgs
// ): Promise<Nullable<MutationBroadcastViewerUserActivityArgs>> {
//   const commentsResources = await getCommentsResources([args.commentId])
//   const commentResources = commentsResources[args.commentId] || null
//   if (!commentResources?.resources?.length) return null

//   const objectIds = commentResources.resources
//     .filter((r) => r.resourceType === ResourceType.Object)
//     .map((r) => r.resourceId)
//   const commitIds = commentResources.resources
//     .filter((r) => r.resourceType === ResourceType.Commit)
//     .map((r) => r.resourceId)
//   const branches = keyBy(await getCommitBranches(commitIds), 'commitId')

//   const resourceUrlBuilder = SpeckleViewer.ViewerRoute.resourceBuilder()
//   for (const objectId of objectIds) {
//     resourceUrlBuilder.addObject(objectId)
//   }
//   for (const commitId of commitIds) {
//     const branch = branches[commitId]
//     if (branch) {
//       resourceUrlBuilder.addModel(branch.id, commitId)
//     }
//   }

//   const resourceIdString = resourceUrlBuilder.toString()
//   if (!resourceIdString) return null
// }
