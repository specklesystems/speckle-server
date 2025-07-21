import { MaybeNullOrUndefined, Optional, resolveMixpanelUserId } from '@speckle/shared'
import * as MixpanelUtils from '@speckle/shared/observability/mixpanel'
import {
  enableMixpanel,
  getServerOrigin,
  getServerVersion
} from '@/modules/shared/helpers/envHelper'
import Mixpanel from 'mixpanel'
import type express from 'express'
import type http from 'http'
import { mixpanelLogger } from '@/observability/logging'
import { WorkspacePlanStatuses } from '@/modules/core/graph/generated/graphql'

let client: Optional<MixpanelClient> = undefined
let baseTrackingProperties: Optional<Record<string, string>> = undefined

export const WORKSPACE_TRACKING_ID_KEY = 'workspace_id' as const
export const SERVER_TRACKING_ID_KEY = 'server_id' as const
export const USER_TRACKING_ID_KEY = 'distinct_id' as const

type MixpanelEvent = (typeof MixpanelEvents)[keyof typeof MixpanelEvents]
export const MixpanelEvents = {
  WorkspaceUpgraded: 'Workspace Upgraded',
  WorkspaceCreated: 'Workspace Created',
  WorkspaceDeleted: 'Workspace Deleted',
  WorkspaceSubscriptionCanceled: 'Workspace Subscription Canceled',
  WorkspaceSubscriptionCancelationScheduled:
    'Workspace Subscription Cancelation Scheduled',
  WorkspaceSubscriptionPaymentFailed: 'Workspace Subscription Payment Failed',
  FileUploadStarted: 'File Upload Started',
  AutomateFunctionRunFinished: 'Automate Function Run Finished',
  AutomationRunTriggered: 'Automation Run Triggered',
  SignUp: 'Sign Up',
  EditorSeatsPurchased: 'Editor Seats Purchased',
  EditorSeatsDownscaled: 'Editor Seats Downscaled',
  EditorSeatAssigned: 'Editor Seat Assigned',
  EditorSeatUnassigned: 'Editor Seat Unassigned'
} as const

export const mapPlanStatusToMixpanelEvent = {
  [WorkspacePlanStatuses.CancelationScheduled]:
    MixpanelEvents.WorkspaceSubscriptionCancelationScheduled,
  [WorkspacePlanStatuses.Canceled]: MixpanelEvents.WorkspaceSubscriptionCanceled,
  [WorkspacePlanStatuses.PaymentFailed]:
    MixpanelEvents.WorkspaceSubscriptionPaymentFailed
} as const

type TrackParameters = {
  eventName: MixpanelEvent
  payload?: Mixpanel.PropertyDict
  workspaceId?: MaybeNullOrUndefined<string>
  userEmail?: MaybeNullOrUndefined<string>
  req?: Optional<express.Request | http.IncomingMessage>
}

export function getBaseTrackingProperties() {
  if (baseTrackingProperties) return baseTrackingProperties
  baseTrackingProperties = MixpanelUtils.buildBasePropertiesPayload({
    hostApp: 'serverside',
    serverOrigin: getServerOrigin(),
    speckleVersion: getServerVersion()
  })

  return baseTrackingProperties
}

export function initialize() {
  if (client || !enableMixpanel()) return

  const mixpanel = MixpanelUtils.buildServerMixpanelClient({
    tokenId: 'acd87c5a50b56df91a795e999812a3a4',
    apiHostname: 'analytics.speckle.systems'
  })

  /**
   * An abstraction layer over the track method that adds the id keys
   * for the specified common objects
   */
  const mixpanelTrack = mixpanel.track
  const overwrittenTrack = async ({
    eventName,
    payload,
    workspaceId,
    userEmail,
    req
  }: TrackParameters) => {
    const logger = req?.log || mixpanelLogger
    const mixpanelUserId = userEmail?.length
      ? resolveMixpanelUserId(userEmail)
      : undefined

    const context = {
      ...(workspaceId && { [WORKSPACE_TRACKING_ID_KEY]: workspaceId }),
      ...MixpanelUtils.buildPropertiesPayload({
        distinctId: mixpanelUserId,
        query: (req && 'query' in req ? req?.query : {}) || {},
        headers: req?.headers || {},
        remoteAddress: req?.socket?.remoteAddress
      }),
      ...getBaseTrackingProperties()
    }

    return new Promise<void>((resolve, reject) => {
      mixpanelTrack(
        eventName,
        {
          ...payload,
          ...context
        },
        (err) => {
          logger.info(
            {
              eventName,
              payload,
              ...(err ? { err } : {})
            },
            'Mixpanel track() invoked'
          )
          if (err) return reject(err)
          resolve()
        }
      )
    })
  }

  client = {
    ...mixpanel,
    track: overwrittenTrack
  }
}

export function getClient() {
  return client
}

export const getMixpanelClient = getClient

export type MixpanelClient = Omit<Mixpanel.Mixpanel, 'track'> & {
  track: (args: TrackParameters) => Promise<void>
}

export { resolveMixpanelUserId }
