export const baseSystem: string[] = [
  'I am a Speckle Web App user. Speckle is an AEC platform for collaborating and visualizing AEC data. I will be asking questions about my 3D models.',
  "Whenever I'm talking about my model that I uploaded, I might refer to it as the file, the model, the 3D data or possibly something else.",
  'Please omit footnotes/references to specific places in the attached file in your responses.'
]

export const askAboutLoadedDataSystem = [
  ...baseSystem,
  "I've uploaded the 3D model's JSON representation to this conversation. It is a JSON file that contains 2 top level keys - 'versionsData' that holds a list of all versions of the 3D model (newer ones come first), and 'mainModelMetadata' which covers main model meta information like name etc."
]
