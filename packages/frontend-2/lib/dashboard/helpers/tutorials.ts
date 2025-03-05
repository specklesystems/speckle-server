import { TutorialProduct, type TutorialItem } from '~/lib/dashboard/helpers/types'

export const tutorialProducts = Object.freeze(<const>{
  [TutorialProduct.Grasshopper]: 'Grasshopper',
  [TutorialProduct.PowerBI]: 'Power BI',
  [TutorialProduct.Revit]: 'Revit',
  [TutorialProduct.Rhino]: 'Rhino',
  [TutorialProduct.AutoCad]: 'AutoCad',
  [TutorialProduct.Automate]: 'Automate',
  [TutorialProduct.Blender]: 'Blender',
  [TutorialProduct.SketchUp]: 'SketchUp',
  [TutorialProduct.Unreal]: 'Unreal',
  [TutorialProduct.Unity]: 'Unity'
})

export const tutorialItems: TutorialItem[] = [
  {
    title: 'How To Get Data From Grasshopper Into Power BI',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/677d34c3f1e3b99aa578bfea_GH%20to%20PBI%20tutorial-p-800.jpg',
    url: 'https://www.speckle.systems/tutorials/best-way-to-get-data-from-grasshopper-into-power-bi',
    products: [TutorialProduct.Grasshopper, TutorialProduct.PowerBI]
  },
  {
    title: 'Automating CFD Analysis with Speckle',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c508e14c68996f7aa1f5_66d648086cd656dae5168a85_Tutorial-Graphics-automate-centeres-cfd-1.png',
    url: 'https://www.speckle.systems/tutorials/automating-cfd-analysis-with-speckle',
    products: [TutorialProduct.Automate]
  },
  {
    title: 'PowerQuery(QL) for AEC Data Analysis',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c49549279bcda21c3115_66e047f5c915694aefb78105_powerquery-specklecon%25400.5x.png',
    url: 'https://www.speckle.systems/tutorials/powerquery-ql-for-aec-data-analysis',
    products: [TutorialProduct.PowerBI]
  },
  {
    title: 'From Grasshopper Placeholders to Unreal Assets',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c50919d477e7b4454747_66e047f5b7f992018acdb66b_grasshopper-unreal%25400.5x.png',
    url: 'https://www.speckle.systems/tutorials/from-grasshopper-placeholders-to-unreal-assets',
    products: [TutorialProduct.Grasshopper, TutorialProduct.Unreal]
  },
  {
    title: 'Rhino Block to Revit Family',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c50a49279bcda21c9483_66e047f58da87f021da53e06_rhino-2-rvt-families%25400.5x.png',
    url: 'https://www.speckle.systems/tutorials/rhino-block-to-revit-family',
    products: [TutorialProduct.Rhino, TutorialProduct.Revit]
  },
  {
    title: 'SketchUp Components to Revit Families',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c50ac6269f3166039982_66e047f51d1cb84078e7320a_skp-2-rvt-families%25400.5x.png',
    url: 'https://www.speckle.systems/tutorials/sketchup-components-to-revit-families',
    products: [TutorialProduct.SketchUp, TutorialProduct.Revit]
  },
  {
    title: 'Block to Family Conversion with Speckle',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c50ac50a28b58fe0e10b_66e047f505114bd4a6854b6a_216-blocks-to-families%25400.5x.png',
    url: 'https://www.speckle.systems/tutorials/new-in-2-16-block-to-family-conversion',
    products: [
      TutorialProduct.Revit,
      TutorialProduct.Rhino,
      TutorialProduct.SketchUp,
      TutorialProduct.AutoCad,
      TutorialProduct.Blender,
      TutorialProduct.Unity
    ]
  },
  {
    title: 'SketchUp Connector for Mac',
    image:
      'https://cdn.prod.website-files.com/66c31b5a50432200dc753cc4/66f9c508c50a28b58fe0ddef_66e047f6aacfa88a6524a956_final-blog.jpeg',
    url: 'https://www.speckle.systems/tutorials/sketchup-connector-for-mac',
    products: [TutorialProduct.SketchUp]
  }
]
