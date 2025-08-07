/**
 * Primitive color values for the design system
 * These are the raw color values that will be used to build semantic tokens
 */

export const primitives = {
  // Neutral grays
  neutral: {
    5: '#121212',
    10: '#1C1C1C',
    15: '#262626',
    20: '#353535',
    25: '#444444',
    30: '#515151',
    35: '#5C5C5C',
    40: '#707070',
    50: '#7B7B7B',
    55: '#8A8A8A',
    65: '#ADADAD',
    75: '#C2C2C2',
    85: '#D6D6D6',
    90: '#E2E2E2',
    92: '#EDEDED',
    95: '#F2F2F2',
    97: '#F7F7F7',
    99: '#FCFCFC'
  },

  // Neutral alpha variants
  neutralAlpha: {
    5: '#000000ED',
    10: '#000000E3',
    15: '#000000D9',
    20: '#000000C9',
    25: '#000000BA',
    30: '#000000AD',
    35: '#000000A3',
    40: '#0000008F',
    50: '#00000085',
    55: '#00000075',
    65: '#00000052',
    75: '#0000003D',
    85: '#00000029',
    90: '#0000001C',
    92: '#00000012',
    95: '#0000000D',
    97: '#00000008',
    99: '#00000003'
  },

  // Dark neutral grays
  darkNeutral: {
    5: '#0F1215',
    10: '#191C20',
    15: '#23272B',
    20: '#31363C',
    25: '#3E444C',
    30: '#4A525A',
    35: '#555D66',
    40: '#67717C',
    50: '#727C88',
    55: '#808C99',
    65: '#A5AEB8',
    75: '#BDC3CA',
    85: '#D3D7DB',
    90: '#E0E2E5',
    92: '#EBEDEF',
    95: '#F1F2F3',
    97: '#F6F7F7',
    99: '#FBFCFB'
  },

  // Dark neutral alpha variants
  darkNeutralAlpha: {
    5: '#FFFFFF03',
    10: '#FFFFFF0A',
    15: '#FFFFFF17',
    20: '#FFFFFF26',
    25: '#FFFFFF36',
    30: '#FFFFFF45',
    35: '#FFFFFF4F',
    40: '#FFFFFF66',
    50: '#FFFFFF70',
    55: '#FFFFFF82',
    65: '#FFFFFFA8',
    75: '#FFFFFFBD',
    85: '#FFFFFFD4',
    90: '#FFFFFFE0',
    92: '#FFFFFFEB',
    95: '#FFFFFFF0',
    97: '#FFFFFFF7',
    99: '#FFFFFFFC'
  },

  // Blue palette
  blue: {
    5: '#010F30',
    10: '#001845',
    15: '#00215C',
    20: '#002E7A',
    25: '#003B97',
    30: '#0047B2',
    35: '#0151C8',
    40: '#0063F1',
    50: '#146FFF',
    55: '#3D85FE',
    65: '#7CADFF',
    75: '#A2C4FC',
    85: '#C3D8FB',
    90: '#D5E3FB',
    92: '#E5EDFB',
    95: '#ECF2FC',
    97: '#F4F7FC',
    99: '#FBFCFD'
  },

  // Yellow palette
  yellow: {
    5: '#1B0F00',
    10: '#281800',
    15: '#362200',
    20: '#4A2F01',
    25: '#5C3C00',
    30: '#6E4901',
    35: '#7C5300',
    40: '#966503',
    50: '#A46F03',
    55: '#B97D00',
    65: '#E69C03',
    75: '#FFB126',
    85: '#FDCE8D',
    90: '#FCDDB3',
    92: '#FBEAD3',
    95: '#FCF0E0',
    97: '#FCF6ED',
    99: '#FEFBF8'
  },

  // Green palette
  green: {
    5: '#05160A',
    10: '#082211',
    15: '#0E2E19',
    20: '#163F24',
    25: '#1E4F2F',
    30: '#255F39',
    35: '#2B6B41',
    40: '#358250',
    50: '#3C8E58',
    55: '#44A064',
    65: '#57C87E',
    75: '#68DF90',
    85: '#7EF4A3',
    90: '#B0F6C3',
    92: '#D3F8DC',
    95: '#E1F9E6',
    97: '#EDFBF0',
    99: '#F8FDF9'
  },

  // Red palette
  red: {
    5: '#290103',
    10: '#3C0104',
    15: '#4F0007',
    20: '#6A010D',
    25: '#830112',
    30: '#9B0017',
    35: '#AF011C',
    40: '#D20023',
    50: '#E50328',
    55: '#FF1732',
    65: '#FF837C',
    75: '#FCA9A3',
    85: '#FBC9C4',
    90: '#FBD9D6',
    92: '#FBE8E5',
    95: '#FBEEED',
    97: '#FCF5F4',
    99: '#FDFBFB'
  },

  // Orange palette
  orange: {
    5: '#1F0C01',
    10: '#2F1300',
    15: '#3E1C01',
    20: '#542700',
    25: '#693300',
    30: '#7D3E02',
    35: '#8D4601',
    40: '#AA5602',
    50: '#BA5E00',
    55: '#D16B04',
    65: '#FF8924',
    75: '#FCAE79',
    85: '#FBCCAD',
    90: '#FADBC7',
    92: '#FBE9DD',
    95: '#FBEFE7',
    97: '#FCF5F1',
    99: '#FDFBFA'
  },

  // Purple palette
  purple: {
    5: '#160236',
    10: '#22014D',
    15: '#2F0165',
    20: '#400186',
    25: '#5102A5',
    30: '#6104C3',
    35: '#6E03DB',
    40: '#8323FE',
    50: '#8A45FE',
    55: '#9665FF',
    65: '#B39AFF',
    75: '#C6B7FC',
    85: '#D8D0FB',
    90: '#E3DEFA',
    92: '#EDEAFB',
    95: '#F2F0FB',
    97: '#F7F6FC',
    99: '#FCFBFE'
  },

  // Pink palette
  pink: {
    5: '#250119',
    10: '#370127',
    15: '#480034',
    20: '#610147',
    25: '#790159',
    30: '#8F026A',
    35: '#A10278',
    40: '#C20391',
    50: '#D4009F',
    55: '#EE02B3',
    65: '#FF72CC',
    75: '#FCA0D7',
    85: '#FBC4E3',
    90: '#FAD6EA',
    92: '#FBE6F1',
    95: '#FBEDF5',
    97: '#FCF4F8',
    99: '#FEFBFC'
  },

  // Pure black and white
  black: '#000000',
  white: '#FFFFFF'
} as const

export type Primitives = typeof primitives
