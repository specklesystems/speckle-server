import {
  PaidWorkspacePlansOld,
  Roles,
  WorkspacePlanBillingIntervals,
  type WorkspacePlanPriceStructure
} from '@speckle/shared'

// TODO: Read these from API, especially for new plans
export const WorkspaceOldPaidPlanPrices: {
  [plan in PaidWorkspacePlansOld]: WorkspacePlanPriceStructure
} = {
  [PaidWorkspacePlansOld.Starter]: {
    [WorkspacePlanBillingIntervals.Monthly]: {
      [Roles.Workspace.Guest]: 15,
      [Roles.Workspace.Member]: 15,
      [Roles.Workspace.Admin]: 15
    },
    [WorkspacePlanBillingIntervals.Yearly]: {
      [Roles.Workspace.Guest]: 12,
      [Roles.Workspace.Member]: 12,
      [Roles.Workspace.Admin]: 12
    }
  },
  [PaidWorkspacePlansOld.Plus]: {
    [WorkspacePlanBillingIntervals.Monthly]: {
      [Roles.Workspace.Guest]: 15,
      [Roles.Workspace.Member]: 50,
      [Roles.Workspace.Admin]: 50
    },
    [WorkspacePlanBillingIntervals.Yearly]: {
      [Roles.Workspace.Guest]: 12,
      [Roles.Workspace.Member]: 40,
      [Roles.Workspace.Admin]: 40
    }
  },
  [PaidWorkspacePlansOld.Business]: {
    [WorkspacePlanBillingIntervals.Monthly]: {
      [Roles.Workspace.Guest]: 15,
      [Roles.Workspace.Member]: 75,
      [Roles.Workspace.Admin]: 75
    },
    [WorkspacePlanBillingIntervals.Yearly]: {
      [Roles.Workspace.Guest]: 12,
      [Roles.Workspace.Member]: 60,
      [Roles.Workspace.Admin]: 60
    }
  }
}
