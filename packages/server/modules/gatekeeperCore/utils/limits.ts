import { GraphQLContext } from '@/modules/shared/helpers/typeHelper'
import {
  getProjectLimitDateFactory as getProjectLimitDateFactoryBase,
  isCreatedBeyondHistoryLimitCutoffFactory as isCreatedBeyondHistoryLimitCutoffFactoryBase,
  IsCreatedBeyondHistoryLimitCutoff,
  GetProjectLimitDate
} from '@speckle/shared'
import { PersonalProjectsLimits } from '@speckle/shared/authz'
import { getFeatureFlags } from '@speckle/shared/environment'

const { FF_PERSONAL_PROJECTS_LIMITS_ENABLED } = getFeatureFlags()
const getPersonalProjectLimits = FF_PERSONAL_PROJECTS_LIMITS_ENABLED
  ? () => Promise.resolve(PersonalProjectsLimits)
  : () => Promise.resolve(null)

export const isCreatedBeyondHistoryLimitCutoffFactory = (deps: {
  ctx: GraphQLContext
}): IsCreatedBeyondHistoryLimitCutoff => {
  const getProjectLimitDate = getProjectLimitDateFactory(deps)
  const isCreatedBeyondHistoryLimitCutoffFactory =
    isCreatedBeyondHistoryLimitCutoffFactoryBase({
      getProjectLimitDate
    })

  return isCreatedBeyondHistoryLimitCutoffFactory
}

export const getProjectLimitDateFactory = (deps: {
  ctx: GraphQLContext
}): GetProjectLimitDate => {
  const getProjectLimitDate = getProjectLimitDateFactoryBase({
    // this one
    getWorkspaceLimits: async ({ workspaceId }) =>
      (await deps.ctx.loaders.gatekeeper?.getWorkspaceLimits.load(workspaceId)) || null,
    getPersonalProjectLimits
  })

  return getProjectLimitDate
}
