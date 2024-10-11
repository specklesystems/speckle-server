import { GetWorkspacePlan } from '@/modules/gatekeeper/domain/billing'

export const getWorkspacePlanFactory = (): GetWorkspacePlan => () => {
  // should throw for not found workspaces
  return new Promise((resolve) => {
    resolve({ name: 'team', status: 'trial' })
  })
}
