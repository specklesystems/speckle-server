import { type ConnectorItem, ConnectorCategory } from '~~/lib/dashboard/helpers/types'

export const connectorCategories = Object.freeze(<const>{
  [ConnectorCategory.NextGen]: 'NextGen',
  [ConnectorCategory.Visualisation]: 'Visualisation',
  [ConnectorCategory.Structural]: 'Structural',
  [ConnectorCategory.Infrastructure]: 'Infrastructure',
  [ConnectorCategory.GIS]: 'GIS',
  [ConnectorCategory.CADAndModeling]: 'CAD & Modeling',
  [ConnectorCategory.BusinessIntelligence]: 'Business Intelligence',
  [ConnectorCategory.VisualProgramming]: 'Visual Programming',
  [ConnectorCategory.BIM]: 'BIM'
})

// `NEW CONNECTOR CHECK` (note this is a comment oguzhan will use to find the hardcoded slugs again)
export const connectorItems: ConnectorItem[] = [
  {
    title: 'Revit',
    slug: 'revit',
    description:
      'Publish and load Revit models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/revit',
    images: ['/images/connectors/revit.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Rhino + Grasshopper',
    slug: 'rhino',
    description:
      'Publish and load Rhino and Grasshopper models for high-quality design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/rhino',
    images: ['/images/connectors/rhino.png', '/images/connectors/grasshopper.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Power BI',
    slug: 'powerbi',
    description:
      'Load your models into Power BI to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/power-bi',
    images: ['/images/connectors/powerbi.png'],
    categories: [ConnectorCategory.BusinessIntelligence]
  },
  {
    title: 'SketchUp',
    slug: 'sketchup',
    description:
      'Publish and load SketchUp models for high-quality design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/sketchup',
    images: ['/images/connectors/sketchup.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'AutoCAD',
    slug: 'autocad',
    description:
      'Publish and load AutoCAD models for high-quality design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/autocad',
    images: ['/images/connectors/autocad.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Civil3D',
    slug: 'civil3d',
    description:
      'Publish and load Civil 3D models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/civil3d',
    images: ['/images/connectors/civil3d.png'],
    categories: [
      ConnectorCategory.NextGen,
      ConnectorCategory.Infrastructure,
      ConnectorCategory.CADAndModeling
    ]
  },
  {
    title: 'ETABS',
    slug: 'etabs',
    description:
      'Publish ETABS models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/etabs',
    images: ['/images/connectors/etabs.png'],
    categories: [ConnectorCategory.Structural]
  },
  {
    title: 'Navisworks',
    slug: 'navisworks',
    description:
      'Publish Navisworks models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/navisworks',
    images: ['/images/connectors/navisworks.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Archicad',
    slug: 'archicad',
    description:
      'Publish Archicad models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/archicad',
    images: ['/images/connectors/archicad.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Tekla',
    slug: 'teklastructures',
    description:
      'Publish Tekla Structures models to boost design coordination and business intelligence workflows.',
    url: 'https://docs.speckle.systems/connectors/tekla',
    images: ['/images/connectors/teklastructures.png'],
    categories: [ConnectorCategory.NextGen, ConnectorCategory.Structural]
  },
  {
    title: 'Blender',
    slug: 'blender',
    description: 'Load models into Blender to boost design coordination workflows.',
    images: ['/images/connectors/blender.png'],
    url: 'https://docs.speckle.systems/connectors/blender',
    categories: [ConnectorCategory.Visualisation, ConnectorCategory.CADAndModeling]
  }
]
