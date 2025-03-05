import type { LayoutDialogButton } from '@speckle/ui-components'

export enum TutorialProduct {
  AutoCad = 'AUTOCAD',
  Automate = 'AUTOMATE',
  Blender = 'BLENDER',
  Grasshopper = 'GRASSHOPPER',
  PowerBI = 'POWERBI',
  Revit = 'REVIT',
  Rhino = 'RHINO',
  SketchUp = 'SKETCHUP',
  SpecklePy = 'SPECKLEPY',
  Unity = 'UNITY',
  Unreal = 'UNREAL'
}

export type TutorialItem = {
  title: string
  image: string
  url: string
  products: TutorialProduct[]
}

export type QuickStartItem = {
  title: string
  description: string
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
  image: string
  url: string
  description: string
  categories?: ConnectorCategory[]
}
