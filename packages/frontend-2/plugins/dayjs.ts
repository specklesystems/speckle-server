import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import duration from 'dayjs/plugin/duration.js'
import updateLocale from 'dayjs/plugin/updateLocale'

// Only add YYYY if it is not this year
const formatDate = (input: Dayjs) =>
  input.year() === dayjs().year() ? input.format('MMM D') : input.format('MMM D, YYYY')

const isClockUnit = (unit: string) =>
  unit.includes('second') || unit.includes('minute') || unit.includes('hour')

export default defineNuxtPlugin(() => {
  dayjs.extend(relativeTime)
  dayjs.extend(localizedFormat)
  dayjs.extend(duration)
  dayjs.extend(updateLocale)

  dayjs.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: (input: string) => {
        const count = parseInt(input.split(' ')[0])

        // Only add 'ago' to the returned string if it's a clock unit
        if (isClockUnit(input)) {
          return `${input} ago`
        }

        // Only format as days if less than 14 days ago
        return input.includes('day') && count <= 14 ? `${count} days ago` : input
      },
      s: 'just now',
      m: 'a minute',
      mm: '%d minutes',
      h: 'an hour',
      hh: '%d hours',
      d: 'a day',
      dd: (count: number) =>
        // If more than 14 days ago return the formatted dates instead of 'x days ago'
        count <= 14 ? `${count} days ago` : formatDate(dayjs().subtract(count, 'day')),
      M: (count: number) => formatDate(dayjs().subtract(count, 'month')),
      MM: (count: number) => formatDate(dayjs().subtract(count, 'month')),
      y: (count: number) => formatDate(dayjs().subtract(count, 'year')),
      yy: (count: number) => formatDate(dayjs().subtract(count, 'year'))
    }
  })

  const getFullDate = (input: string) => dayjs(input).format('MMM D, YYYY H:mm')
  const getTrunicatedDate = (input: string) => dayjs(input).from(dayjs())
  const getTrunicatedDateWithPrefix = (input: string) =>
    isClockUnit(input) ? dayjs(input).from(dayjs()) : `on ${dayjs(input).from(dayjs())}`

  return {
    provide: {
      getFullDate,
      getTrunicatedDate,
      getTrunicatedDateWithPrefix
    }
  }
})
