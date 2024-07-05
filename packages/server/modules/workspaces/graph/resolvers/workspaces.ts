import { Resolvers } from "@/modules/core/graph/generated/graphql";

export = {
  Query: {
    workspace: async () => {
      // Get workspace by id
    }
  },
  WorkspaceMutations: {
    create: async () => { },
    delete: async () => { },
    update: async () => { },
    updateRole: async () => { },
    deleteRole: async () => { }
  },
  WorkspaceInviteMutations: {
    create: async () => { },
    batchCreate: async () => { },
    use: async () => { },
    cancel: async () => { }
  },
  Workspace: {
    role: async () => {
      // Get user id from parent, get role and return
    },
    team: async () => {
      // Get roles for workspace
    },
    invitedTeam: async () => {
      // Get invites
    },
    projects: async () => {
      // Get projects in workspace
    }
  },
  User: {
    workspaces: async () => {
      // Get roles for user, get workspaces
    }
  },
  Project: {
    workspace: async () => {
      // Get workspaceId from project, get and return workspace data
    }
  },
  AdminQueries: {
    workspaceList: async () => { }
  }
} as Resolvers