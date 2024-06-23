import { useIntervalFn } from '@vueuse/core'
import type dayjs from 'dayjs'

export const useReactiveNowDate = (
  params?: Partial<{
    /**
     * How often should the date be updated in milliseconds. Default: 1000ms
     */
    updateEvery: number
  }>
) => {
  const { updateEvery = 1000 } = params || {}

  const date = ref(new Date())

  useIntervalFn(() => {
    date.value = new Date()
  }, updateEvery)

  return date
}

export const useFormatDuration = () => {
  const durationFormat = (duration: ReturnType<typeof dayjs.duration>) => {
    let format = 'ss[s]'
    if (duration.minutes() > 0) format = 'mm[m] ' + format
    if (duration.hours() > 0) format = 'HH[h] ' + format
    if (duration.days() > 0) format = 'D [days] ' + format
    if (duration.months() > 0) format = 'M [months] ' + format
    if (duration.years() > 0) format = 'Y [years] ' + format

    return format
  }

  return durationFormat
}
