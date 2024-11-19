import type {
  BillingInterval,
  WorkspacePlans
} from '~/lib/common/generated/gql/graphql'
import type { WorkspaceRoles } from '@speckle/shared'

export enum PlanFeaturesList {
  Workspaces = 'Workspaces',
  RoleManagement = 'Role management',
  GuestUsers = 'Guest users',
  PrivateAutomateFunctions = 'Private automate functions',
  DomainSecurity = 'Domain security',
  SSO = 'Single Sign-On (SSO)',
  CustomDataRegion = 'Custom data region',
  PrioritySupport = 'Priority support'
}

export type PricingPlan = {
  name: WorkspacePlans
  features: PlanFeaturesList[]
  cost: {
    [I in BillingInterval]: Record<WorkspaceRoles, number>
  }
}
