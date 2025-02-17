import type { CSSProperties } from 'vue'

export type SlideshowItem = {
  camPos: number[]
  style: Partial<CSSProperties>
  viewed: boolean
  expanded: boolean
  showControls: boolean
  location: { x: number; y: number; z: number }
}

export const items = [
  {
    camPos: [-31.86138, 41.14196, 15.93344, -22.0765, 35.10095, 15.93344, 0, 1],
    style: {} as Partial<CSSProperties>,
    viewed: false,
    showControls: true,
    expanded: true,
    filters: {},
    location: {
      x: -22.0765,
      y: 35.10095,
      z: 15.93344
    }
  },
  {
    camPos: [-3.3795, 40.78977, 23.25852, -20.65056, 40.72203, 21.78906, 0, 1],
    style: {} as Partial<CSSProperties>,
    viewed: false,
    showControls: true,
    expanded: false,
    location: {
      x: -20.65055884838785,
      y: 40.722033808449375,
      z: 21.78905919299372
    }
  },
  {
    camPos: [23.86779, 82.9541, 29.05586, -27.41942, 37.72358, 29.05586, 0, 1],
    style: {} as Partial<CSSProperties>,
    viewed: false,
    showControls: false,
    expanded: false,
    location: {
      x: -18.441618132624676,
      y: 29.75981682574905,
      z: 34.916241813824385
    }
  }
  // {
  //   camPos: [-31.26609, 38.47824, 72.96217, -22.18707, 30.92252, 45.89318, 0, 1],
  //   style: {} as Partial<CSSProperties>,
  //   viewed: false,
  //   expanded: false,
  //   location: {
  //     x: -22.120912712381845,
  //     y: 31.080942719780523,
  //     z: 46.659258961507234
  //   }
  // }
] as SlideshowItem[]
