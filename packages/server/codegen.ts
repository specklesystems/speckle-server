import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: ['modules/core/graph/schema.ts'],
  overwrite: true,
  documents: undefined,
  generates: {
    'modules/core/graph/generated/graphql.ts': {
      documents: [
        'modules/cross-server-sync/**/*.{js,ts}',
        'test/graphql/*.{js,ts}',
        'modules/**/tests/helpers/graphql.ts',
        'modules/**/tests/helpers/*Graphql.ts',
        'modules/**/tests/helpers/graphql/*.ts'
      ],
      plugins: [
        'typescript',
        'typescript-resolvers',
        'typescript-operations',
        'typed-document-node'
      ],
      config: {
        useTypeImports: true,
        enumsAsConst: true,
        contextType: '@/modules/shared/helpers/typeHelper#GraphQLContext',
        mappers: {
          Stream: '@/modules/core/helpers/graphTypes#StreamGraphQLReturn',
          Commit: '@/modules/core/helpers/graphTypes#CommitGraphQLReturn',
          Project: '@/modules/core/helpers/graphTypes#ProjectGraphQLReturn',
          Object: '@/modules/core/helpers/graphTypes#ObjectGraphQLReturn',
          Version: '@/modules/core/helpers/graphTypes#VersionGraphQLReturn',
          ServerInvite:
            '@/modules/core/helpers/graphTypes#ServerInviteGraphQLReturnType',
          Model: '@/modules/core/helpers/graphTypes#ModelGraphQLReturn',
          ModelsTreeItem:
            '@/modules/core/helpers/graphTypes#ModelsTreeItemGraphQLReturn',
          StreamAccessRequest:
            '@/modules/accessrequests/helpers/graphTypes#StreamAccessRequestGraphQLReturn',
          ProjectAccessRequest:
            '@/modules/accessrequests/helpers/graphTypes#ProjectAccessRequestGraphQLReturn',
          ProjectAccessRequestMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          LimitedUser: '@/modules/core/helpers/graphTypes#LimitedUserGraphQLReturn',
          User: '@/modules/core/helpers/graphTypes#UserGraphQLReturn',
          EmbedToken: '@/modules/core/helpers/graphTypes#EmbedTokenGraphQLReturn',
          ActiveUserMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          UserMetaMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          UserEmailMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          ProjectMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          ProjectInviteMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          ModelMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          VersionMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          FileUploadMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          CommentMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          AutomateFunctionPermissionChecks:
            '@/modules/automate/helpers/graphTypes#AutomateFunctionPermissionChecksGraphQLReturn',
          AutomateMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          AdminMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          NotificationMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          AdminQueries: '@/modules/core/helpers/graphTypes#GraphQLEmptyReturn',
          ServerStatistics: '@/modules/core/helpers/graphTypes#GraphQLEmptyReturn',
          ServerStats: '@/modules/core/helpers/graphTypes#GraphQLEmptyReturn',
          CommentReplyAuthorCollection:
            '@/modules/comments/helpers/graphTypes#CommentReplyAuthorCollectionGraphQLReturn',
          Comment: '@/modules/comments/helpers/graphTypes#CommentGraphQLReturn',
          CommentPermissionChecks:
            '@/modules/comments/helpers/graphTypes#CommentPermissionChecksGraphQLReturn',
          PendingStreamCollaborator:
            '@/modules/serverinvites/helpers/graphTypes#PendingStreamCollaboratorGraphQLReturn',
          StreamCollaborator:
            '@/modules/core/helpers/graphTypes#StreamCollaboratorGraphQLReturn',
          ProjectCollaborator:
            '@/modules/core/helpers/graphTypes#ProjectCollaboratorGraphQLReturn',
          FileUpload: '@/modules/fileuploads/helpers/types#FileUploadGraphQLReturn',
          AutomateFunction:
            '@/modules/automate/helpers/graphTypes#AutomateFunctionGraphQLReturn',
          AutomateFunctionRelease:
            '@/modules/automate/helpers/graphTypes#AutomateFunctionReleaseGraphQLReturn',
          Automation: '@/modules/automate/helpers/graphTypes#AutomationGraphQLReturn',
          AutomationPermissionChecks:
            '@/modules/automate/helpers/graphTypes#AutomationPermissionChecksGraphQLReturn',
          AutomationRevision:
            '@/modules/automate/helpers/graphTypes#AutomationRevisionGraphQLReturn',
          AutomationRevisionFunction:
            '@/modules/automate/helpers/graphTypes#AutomationRevisionFunctionGraphQLReturn',
          AutomateRun: '@/modules/automate/helpers/graphTypes#AutomateRunGraphQLReturn',
          AutomationRunTrigger:
            '@/modules/automate/helpers/graphTypes#AutomationRunTriggerGraphQLReturn',
          VersionCreatedTrigger:
            '@/modules/automate/helpers/graphTypes#AutomationRunTriggerGraphQLReturn',
          AutomationRevisionTriggerDefinition:
            '@/modules/automate/helpers/graphTypes#AutomationRevisionTriggerDefinitionGraphQLReturn',
          VersionCreatedTriggerDefinition:
            '@/modules/automate/helpers/graphTypes#AutomationRevisionTriggerDefinitionGraphQLReturn',
          AutomateFunctionRun:
            '@/modules/automate/helpers/graphTypes#AutomateFunctionRunGraphQLReturn',
          TriggeredAutomationsStatus:
            '@/modules/automate/helpers/graphTypes#TriggeredAutomationsStatusGraphQLReturn',
          ProjectAutomationMutations:
            '@/modules/automate/helpers/graphTypes#ProjectAutomationMutationsGraphQLReturn',
          ProjectTriggeredAutomationsStatusUpdatedMessage:
            '@/modules/automate/helpers/graphTypes#ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn',
          ProjectAutomationsUpdatedMessage:
            '@/modules/automate/helpers/graphTypes#ProjectAutomationsUpdatedMessageGraphQLReturn',
          UserAutomateInfo:
            '@/modules/automate/helpers/graphTypes#UserAutomateInfoGraphQLReturn',
          Workspace:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceGraphQLReturn',
          WorkspaceSso:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceSsoGraphQLReturn',
          WorkspaceMutations:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceMutationsGraphQLReturn',
          WorkspaceJoinRequestMutations:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceJoinRequestMutationsGraphQLReturn',
          WorkspaceInviteMutations:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceInviteMutationsGraphQLReturn',
          WorkspacePlan:
            '@/modules/gatekeeperCore/helpers/graphTypes#WorkspacePlanGraphQLReturn',
          WorkspacePlanUsage:
            '@/modules/gatekeeperCore/helpers/graphTypes#WorkspacePlanUsageGraphQLReturn',
          WorkspaceProjectMutations:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceProjectMutationsGraphQLReturn',
          WorkspaceBillingMutations:
            '@/modules/gatekeeper/helpers/graphTypes#WorkspaceBillingMutationsGraphQLReturn',
          PendingWorkspaceCollaborator:
            '@/modules/workspacesCore/helpers/graphTypes#PendingWorkspaceCollaboratorGraphQLReturn',
          WorkspaceCollaborator:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceCollaboratorGraphQLReturn',
          LimitedWorkspace:
            '@/modules/workspacesCore/helpers/graphTypes#LimitedWorkspaceGraphQLReturn',
          LimitedWorkspaceCollaborator:
            '@/modules/workspacesCore/helpers/graphTypes#LimitedWorkspaceCollaboratorGraphQLReturn',
          WorkspaceSubscriptionSeats:
            '@/modules/gatekeeper/helpers/graphTypes#WorkspaceSubscriptionSeatsGraphQLReturn',
          WorkspaceJoinRequest:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspaceJoinRequestGraphQLReturn',
          LimitedWorkspaceJoinRequest:
            '@/modules/workspacesCore/helpers/graphTypes#LimitedWorkspaceJoinRequestGraphQLReturn',
          ProjectMoveToWorkspaceDryRun:
            '@/modules/workspacesCore/helpers/graphTypes#ProjectMoveToWorkspaceDryRunGraphQLReturn',
          Webhook: '@/modules/webhooks/helpers/graphTypes#WebhookGraphQLReturn',
          SmartTextEditorValue:
            '@/modules/core/services/richTextEditorService#SmartTextEditorValueGraphQLReturn',
          BlobMetadata: '@/modules/blobstorage/domain/types#BlobStorageItem',
          ServerWorkspacesInfo: '@/modules/core/helpers/graphTypes#GraphQLEmptyReturn',
          ActivityCollection:
            '@/modules/activitystream/helpers/graphTypes#ActivityCollectionGraphQLReturn',
          ProjectRole:
            '@/modules/workspacesCore/helpers/graphTypes#ProjectRoleGraphQLReturn',
          ServerApp: '@/modules/auth/helpers/graphTypes#ServerAppGraphQLReturn',
          ServerAppListItem:
            '@/modules/auth/helpers/graphTypes#ServerAppListItemGraphQLReturn',
          ServerInfo: '@/modules/core/helpers/graphTypes#ServerInfoGraphQLReturn',
          Branch: '@/modules/core/helpers/graphTypes#BranchGraphQLReturn',
          GendoAIRender:
            '@/modules/gendo/helpers/types/graphTypes#GendoAIRenderGraphQLReturn',
          ServerMultiRegionConfiguration:
            '@/modules/core/helpers/graphTypes#GraphQLEmptyReturn',
          ServerInfoMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          ServerRegionMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          ServerRegionItem:
            '@/modules/multiregion/helpers/graphTypes#ServerRegionItemGraphQLReturn',
          Price: '@/modules/gatekeeperCore/helpers/graphTypes#PriceGraphQLReturn',
          WorkspaceSubscription:
            '@/modules/gatekeeper/helpers/graphTypes#WorkspaceSubscriptionGraphQLReturn',
          UserMeta: '@/modules/core/helpers/graphTypes#UserMetaGraphQLReturn',
          ProjectPermissionChecks:
            '@/modules/core/helpers/graphTypes#ProjectPermissionChecksGraphQLReturn',
          ModelPermissionChecks:
            '@/modules/core/helpers/graphTypes#ModelPermissionChecksGraphQLReturn',
          VersionPermissionChecks:
            '@/modules/core/helpers/graphTypes#VersionPermissionChecksGraphQLReturn',
          RootPermissionChecks:
            '@/modules/core/helpers/graphTypes#RootPermissionChecksGraphQLReturn',
          WorkspacePermissionChecks:
            '@/modules/workspacesCore/helpers/graphTypes#WorkspacePermissionChecksGraphQLReturn',
          AccSyncItem: '@/modules/acc/helpers/graphTypes#AccSyncItemGraphQLReturn',
          AccSyncItemMutations:
            '@/modules/acc/helpers/graphTypes#AccSyncItemMutationsGraphQLReturn',
          SavedViewMutations:
            '@/modules/core/helpers/graphTypes#MutationsObjectGraphQLReturn',
          SavedView: '@/modules/viewer/helpers/graphTypes#SavedViewGraphQLReturn',
          SavedViewGroup:
            '@/modules/viewer/helpers/graphTypes#SavedViewGroupGraphQLReturn',
          PermissionCheckResult:
            '@/modules/core/helpers/graphTypes#PermissionCheckResultGraphQLReturn',
          SavedViewPermissionChecks:
            '@/modules/viewer/helpers/graphTypes#SavedViewPermissionChecksGraphQLReturn',
          SavedViewGroupPermissionChecks:
            '@/modules/viewer/helpers/graphTypes#SavedViewGroupPermissionChecksGraphQLReturn',
          ExtendedViewerResources:
            '@/modules/viewer/helpers/graphTypes#ExtendedViewerResourcesGraphQLReturn',
          Dashboard: '@/modules/dashboards/helpers/graphTypes#DashboardGraphQLReturn',
          DashboardMutations:
            '@/modules/dashboards/helpers/graphTypes#DashboardMutationsGraphQLReturn',
          DashboardPermissionChecks:
            '@/modules/dashboards/helpers/graphTypes#DashboardPermissionChecksGraphQLReturn',
          DashboardToken:
            '@/modules/dashboards/helpers/graphTypes#DashboardTokenGraphQLReturn'
        }
      }
    }
  },
  config: {
    enumsAsConst: true,
    scalars: {
      JSONObject: 'Record<string, unknown>',
      DateTime: 'Date'
    }
  }
}

export default config
