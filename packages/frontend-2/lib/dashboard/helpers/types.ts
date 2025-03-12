import type { LayoutDialogButton } from '@speckle/ui-components'

export type TutorialItem = {
  title: string
  image: string
  url: string
}

export type QuickStartItem = {
  title: string
  description: string
  isExternalRoute?: boolean
  buttons: LayoutDialogButton[]
}

export const enum ConnectorCategory {
  NextGen = 'nextGen',
  Visualisation = 'visualisation',
  Structural = 'structural',
  Infrastructure = 'infrastructure',
  GIS = 'gis',
  CADAndModeling = 'cadAndModeling',
  BusinessIntelligence = 'businessIntelligence',
  VisualProgramming = 'visualProgramming',
  BIM = 'bim'
}

export type ConnectorItem = {
  title: string
  slug: string
  image: string
  url?: string
  description: string
  categories?: ConnectorCategory[]
  isComingSoon?: boolean
}

export type Version = {
  Number: string
  Url: string
  Os: number
  Architecture: number
  Date: string
  Prerelease: boolean
}

// yolo
export type Versions = {
  Versions: Version[]
}
