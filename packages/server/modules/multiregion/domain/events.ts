export const multiregionEventNamespace = 'multiregion' as const

const eventPrefix = `${multiregionEventNamespace}.` as const

export const MultiregionEvents = {
  ProjectRegionUpdated: `${eventPrefix}project-region-updated`
} as const

export type MultiregionEvents =
  (typeof MultiregionEvents)[keyof typeof MultiregionEvents]

type ProjectRegionUpdatedPayload = {
  projectId: string
  regionKey: string
}

export type MultiregionEventsPayloads = {
  [MultiregionEvents.ProjectRegionUpdated]: ProjectRegionUpdatedPayload
}
