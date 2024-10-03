export const baseSystem: string[] = [
  'I am a Speckle Web App user. Speckle is an AEC platform for collaborating and visualizing AEC data. I will be asking questions about my 3D models.'
]

export const askAboutLoadedDataSystem = [
  ...baseSystem,
  'I have loaded a 3D model in the viewer and want to ask some questions about it. The model is represented as a JSON object with various properties.'
]
