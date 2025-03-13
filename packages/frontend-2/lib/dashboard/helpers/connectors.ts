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
      'Publish and load models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/revit',
    image: '/images/connectors/revit.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Rhino',
    slug: 'rhino',
    description:
      'Publish and load Rhino models for high-quality design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/rhino',
    image: '/images/connectors/rhino.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Power BI',
    slug: 'powerbi',
    description:
      'Load Power BI models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/power-bi',
    image: '/images/connectors/powerbi.png',
    categories: [ConnectorCategory.BusinessIntelligence]
  },
  {
    title: 'SketchUp',
    slug: 'sketchup',
    description:
      'Publish and load SketchUp models for high-quality design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/sketchup-beta',
    image: '/images/connectors/sketchup.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'QGIS',
    slug: 'qgis',
    description:
      'Publish QGIS models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/qgis',
    image: '/images/connectors/qgis.png',
    categories: [ConnectorCategory.GIS]
  },
  {
    title: 'ArcGIS',
    slug: 'arcgis',
    description:
      'Publish ArcGIS models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/arcgis',
    image: '/images/connectors/arcgis.png',
    categories: [ConnectorCategory.GIS]
  },
  {
    title: 'AutoCAD',
    slug: 'autocad',
    description:
      'Publish and load AutoCAD models for high-quality design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/autocad',
    image: '/images/connectors/autocad.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Civil3D',
    slug: 'civil3d',
    description:
      'Publish and load Civil 3D models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/civil3d',
    image: '/images/connectors/civil3d.png',
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
    url: 'https://www.speckle.systems/connectors/etabs',
    image: '/images/connectors/etabs.png',
    categories: [ConnectorCategory.Structural]
  },
  {
    title: 'Navisworks',
    slug: 'navisworks',
    description:
      'Publish Navisworks models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/navisworks',
    image: '/images/connectors/navisworks.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Archicad',
    slug: 'archicad',
    description:
      'Publish Archicad models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/archicad',
    image: '/images/connectors/archicad.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Tekla',
    slug: 'teklastructures',
    description:
      'Publish Tekla Structures models to boost design coordination and business intelligence workflows.',
    url: 'https://www.speckle.systems/connectors/teklastructures-alpha',
    image: '/images/connectors/teklastructures.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.Structural]
  },

  // Non-available connectors
  {
    title: 'Excel',
    slug: 'excel',
    description: "Create geometry, schedules and analyse your geometry's metadata.",
    image: '/images/connectors/excel.png',
    categories: [ConnectorCategory.BusinessIntelligence],
    isComingSoon: true
  },
  {
    title: 'Blender',
    slug: 'blender',
    description: 'Load Blender models to boost design coordination workflows.',
    image: '/images/connectors/blender.png',
    categories: [ConnectorCategory.Visualisation, ConnectorCategory.CADAndModeling],
    isComingSoon: true
  },
  {
    title: 'Grasshopper',
    slug: 'grasshopper',
    description:
      'Publish and load models to boost design coordination and BI workflows.',
    image: '/images/connectors/grasshopper.png',
    categories: [ConnectorCategory.VisualProgramming],
    isComingSoon: true
  }
]
