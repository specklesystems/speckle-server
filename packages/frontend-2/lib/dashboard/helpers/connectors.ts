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
      'Extract BIM data for further processing and visualisation, or dynamically create models from other CAD applications using Speckle for Revit! Supports Revit 2020 to 2025.',
    url: 'https://www.speckle.systems/connectors/revit',
    image: '/images/connectors/revit.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Rhino',
    slug: 'rhino',
    description:
      'From sending and receiving geometry to scaffolding BIM models from simple geometry: Speckle for Rhino is here to help. Supports versions 6, 7 and 8 on Windows and version 7 on Mac.',
    url: 'https://www.speckle.systems/connectors/rhino',
    image: '/images/connectors/rhino.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Power BI',
    slug: 'powerbi',
    description:
      "Speckle's Power BI Connector allows you to integrate data from various AEC apps (like Revit, Archicad, IFC and more)! You can create detailed analysis and interactive 3D visualisations.",
    url: 'https://www.speckle.systems/connectors/power-bi',
    image: '/images/connectors/powerbi.png',
    categories: [ConnectorCategory.BusinessIntelligence]
  },
  {
    title: 'SketchUp',
    slug: 'sketchup',
    description:
      'Be an early adopter and try the Speckle Connector for SketchUp (Beta). Send your SketchUp models out and receive models from other CAD/BIM apps. Supports versions 2021, 2022, 2023 and 2024.',
    url: 'https://www.speckle.systems/connectors/sketchup-beta',
    image: '/images/connectors/sketchup.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'QGIS',
    slug: 'qgis',
    description:
      'The Speckle Connector for QGIS, compatible with QGIS 3.20 onwards. You can install it from Speckle Manager or directly from the QGIS Plugins menu.',
    url: 'https://www.speckle.systems/connectors/qgis',
    image: '/images/connectors/qgis.png',
    categories: [ConnectorCategory.GIS]
  },
  {
    title: 'AutoCAD',
    slug: 'autocad',
    description:
      'Exchange and extract geometry using the Speckle AutoCAD Connector. Supports versions 2021, 2022, 2023, 2024 and 2025',
    url: 'https://www.speckle.systems/connectors/autocad',
    image: '/images/connectors/autocad.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Civil3D',
    slug: 'civil3d',
    description:
      'Exchange and extract data from Civil3D using Speckle - alignments and more! Supports versions 2021, 2022, 2023, 2024 and 2025.',
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
      'Connect to Speckle with our (alpha) Connector for ETABS 18, 19, 20 and 21. Send and receive structural model data in customisable ways to enhance your workflows!',
    url: 'https://www.speckle.systems/connectors/etabs',
    image: '/images/connectors/etabs.png',
    categories: [ConnectorCategory.Structural]
  },
  {
    title: 'Navisworks',
    slug: 'navisworks',
    description:
      "Share aggregated models from Navisworks (2020-2025) to Speckle: publish geometry and properties from specific search sets, selections, views, or clash results! Speckle's Navisworks Connector allows targeted exports so that you can focus on the most relevant aspects of your model data for enhanced usability in collaborative workflows.",
    url: 'https://www.speckle.systems/connectors/navisworks',
    image: '/images/connectors/navisworks.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Archicad',
    slug: 'archicad',
    description:
      'Extract BIM data for further processing and visualisation, or dynamically create models from other CAD applications using Speckle for Archicad! Supports Archicad 25 to 27.',
    url: 'https://www.speckle.systems/connectors/archicad',
    image: '/images/connectors/archicad.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'TeklaStructures',
    slug: 'teklastructures',
    description:
      'Connect to Speckle with our Connector for Tekla Structures. Send and receive BIM data in customisable ways to enhance your workflows.',
    url: 'https://www.speckle.systems/connectors/teklastructures-alpha',
    image: '/images/connectors/teklastructures.png',
    categories: [ConnectorCategory.NextGen, ConnectorCategory.Structural]
  },

  // Non-available connectors
  {
    title: 'Excel',
    slug: 'excel',
    description:
      "Create geometry, schedules and analyse your geometry's metadata. Available on the Microsoft Office Store.",
    image: '/images/connectors/excel.png',
    categories: [ConnectorCategory.BusinessIntelligence],
    isComingSoon: true
  },
  {
    title: 'Blender',
    slug: 'blender',
    description:
      'Blender is a powerful 3D modeling software and much more than that. Supports Blender 3.X & 4.X versions on Windows and Mac!',
    image: '/images/connectors/blender.png',
    categories: [ConnectorCategory.Visualisation, ConnectorCategory.CADAndModeling],
    isComingSoon: true
  },
  {
    title: 'Grasshopper',
    slug: 'grasshopper',
    description:
      'Create anything from simple to advanced custom workflows using Speckle for Grasshopper, the original Speckle Connector!',
    image: '/images/connectors/grasshopper.png',
    categories: [ConnectorCategory.VisualProgramming],
    isComingSoon: true
  }
]
