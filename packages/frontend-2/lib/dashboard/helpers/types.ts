export type TutorialItem = {
  title: string
  image: string
  url: string
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
  images: string[]
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

export type Versions = {
  Versions: Version[]
}
