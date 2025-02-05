const adjectives = [
  'Tall',
  'Curved',
  'Stacked',
  'Purple',
  'Pink',
  'Rectangular',
  'Circular',
  'Oval',
  'Shiny',
  'Speckled',
  'Blue',
  'Stretched',
  'Round',
  'Spherical',
  'Majestic',
  'Symmetrical'
]

const nouns = [
  'Building',
  'House',
  'Treehouse',
  'Tower',
  'Tunnel',
  'Bridge',
  'Pyramid',
  'Structure',
  'Edifice',
  'Palace',
  'Castle',
  'Villa'
]

export const generateProjectName = () => {
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`
}
