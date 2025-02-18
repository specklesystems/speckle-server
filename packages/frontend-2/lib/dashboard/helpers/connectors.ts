import { type ConnectorItem, ConnectorCategory } from '~~/lib/dashboard/helpers/types'
import revitLogo from '~~/assets/images/connectors/revit.png'
import rhinoLogo from '~~/assets/images/connectors/rhino.png'
import blenderLogo from '~~/assets/images/connectors/blender.png'
import grasshopperLogo from '~~/assets/images/connectors/grasshopper.png'
import powerbiLogo from '~~/assets/images/connectors/powerbi.png'
import sketchupLogo from '~~/assets/images/connectors/sketchup.png'
import qgisLogo from '~~/assets/images/connectors/qgis.png'
import excelLogo from '~~/assets/images/connectors/excel.png'
import autocadLogo from '~~/assets/images/connectors/autocad.png'
import civil3dLogo from '~~/assets/images/connectors/civil3d.png'
import etabsLogo from '~~/assets/images/connectors/etabs.png'
import navisworksLogo from '~~/assets/images/connectors/navisworks.png'
import dynamoLogo from '~~/assets/images/connectors/dynamo.png'
import archicadLogo from '~~/assets/images/connectors/archicad.png'
import unityLogo from '~~/assets/images/connectors/unity.png'
import unrealLogo from '~~/assets/images/connectors/unreal.png'
import teklaLogo from '~~/assets/images/connectors/teklastructures.png'

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

export const connectorItems: ConnectorItem[] = [
  {
    title: 'Revit',
    description:
      'Extract BIM data for further processing and visualisation, or dynamically create models from other CAD applications using Speckle for Revit! Supports Revit 2020 to 2025.',
    url: 'https://www.speckle.systems/connectors/revit',
    image: revitLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Rhino',
    description:
      'From sending and receiving geometry to scaffolding BIM models from simple geometry: Speckle for Rhino is here to help. Supports versions 6, 7 and 8 on Windows and version 7 on Mac.',
    url: 'https://www.speckle.systems/connectors/rhino',
    image: rhinoLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Blender',
    description:
      'Blender is a powerful 3D modeling software and much more than that. Supports Blender 3.X & 4.X versions on Windows and Mac!',
    url: 'https://www.speckle.systems/connectors/blender',
    image: blenderLogo,
    categories: [ConnectorCategory.Visualisation, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Grasshopper',
    description:
      'Create anything from simple to advanced custom workflows using Speckle for Grasshopper, the original Speckle Connector!',
    url: 'https://www.speckle.systems/connectors/grasshopper',
    image: grasshopperLogo,
    categories: [ConnectorCategory.VisualProgramming]
  },
  {
    title: 'Power BI',
    description:
      "Speckle's Power BI Connector allows you to integrate data from various AEC apps (like Revit, Archicad, IFC and more)! You can create detailed analysis and interactive 3D visualisations.",
    url: 'https://www.speckle.systems/connectors/power-bi',
    image: powerbiLogo,
    categories: [ConnectorCategory.BusinessIntelligence]
  },
  {
    title: 'SketchUp',
    description:
      'Be an early adopter and try the Speckle Connector for SketchUp (Beta). Send your SketchUp models out and receive models from other CAD/BIM apps. Supports versions 2021, 2022, 2023 and 2024.',
    url: 'https://www.speckle.systems/connectors/sketchup-beta',
    image: sketchupLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'QGIS',
    description:
      'The Speckle Connector for QGIS, compatible with QGIS 3.20 onwards. You can install it from Speckle Manager or directly from the QGIS Plugins menu.',
    url: 'https://www.speckle.systems/connectors/qgis',
    image: qgisLogo,
    categories: [ConnectorCategory.GIS]
  },
  {
    title: 'Excel',
    description:
      "Create geometry, schedules and analyse your geometry's metadata. Available on the Microsoft Office Store.",
    url: 'https://www.speckle.systems/connectors/excel',
    image: excelLogo,
    categories: [ConnectorCategory.BusinessIntelligence]
  },
  {
    title: 'AutoCAD',
    description:
      'Exchange and extract geometry using the Speckle AutoCAD Connector. Supports versions 2021, 2022, 2023, 2024 and 2025',
    url: 'https://www.speckle.systems/connectors/autocad',
    image: autocadLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.CADAndModeling]
  },
  {
    title: 'Civil3D',
    description:
      'Exchange and extract data from Civil3D using Speckle - alignments and more! Supports versions 2021, 2022, 2023, 2024 and 2025.',
    url: 'https://www.speckle.systems/connectors/civil3d',
    image: civil3dLogo,
    categories: [
      ConnectorCategory.NextGen,
      ConnectorCategory.Infrastructure,
      ConnectorCategory.CADAndModeling
    ]
  },
  {
    title: 'ETABS',
    description:
      'Connect to Speckle with our (alpha) Connector for ETABS 18, 19, 20 and 21. Send and receive structural model data in customisable ways to enhance your workflows!',
    url: 'https://www.speckle.systems/connectors/etabs',
    image: etabsLogo,
    categories: [ConnectorCategory.Structural]
  },
  {
    title: 'Navisworks',
    description:
      "Share aggregated models from Navisworks (2020-2025) to Speckle: publish geometry and properties from specific search sets, selections, views, or clash results! Speckle's Navisworks Connector allows targeted exports so that you can focus on the most relevant aspects of your model data for enhanced usability in collaborative workflows.",
    url: 'https://www.speckle.systems/connectors/navisworks',
    image: navisworksLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Dynamo',
    description:
      'Customise and control basic geometry and transform it into BIM elements using Speckle for Dynamo. Supports Dynamo Revit 2020 to 2023.',
    url: 'https://www.speckle.systems/connectors/dynamo',
    image: dynamoLogo,
    categories: [ConnectorCategory.VisualProgramming]
  },
  {
    title: 'Archicad',
    description:
      'Extract BIM data for further processing and visualisation, or dynamically create models from other CAD applications using Speckle for Archicad! Supports Archicad 25 to 27.',
    url: 'https://www.speckle.systems/connectors/archicad',
    image: archicadLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.BIM]
  },
  {
    title: 'Unity',
    description:
      'Visualise your BIM data in one of the world’s most popular game engines using the Speckle for Unity Connector! Early release for developers.',
    url: 'https://www.speckle.systems/connectors/unity',
    image: unityLogo,
    categories: [ConnectorCategory.Visualisation]
  },
  {
    title: 'Unreal',
    description:
      "Coordinate and curate with Speckle for Unreal: visualise your BIM data in Unreal and build VR/XR applications using Epic's fantastic game engine! Early release for developers.",
    url: 'https://www.speckle.systems/connectors/unreal',
    image: unrealLogo,
    categories: [ConnectorCategory.Visualisation]
  },
  {
    title: 'TeklaStructures',
    description:
      'Connect to Speckle with our Connector for Tekla Structures. Send and receive BIM data in customisable ways to enhance your workflows.',
    url: 'https://www.speckle.systems/connectors/teklastructures-alpha',
    image: teklaLogo,
    categories: [ConnectorCategory.NextGen, ConnectorCategory.Structural]
  }
]
