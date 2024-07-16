import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import duration from 'dayjs/plugin/duration.js'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(duration)

const customRelativeTime = (date: ConfigType): string => {
  const pastDate = dayjs(date)
  const now = dayjs()
  const diffInMinutes = now.diff(date, 'minute')
  const diffInHours = now.diff(date, 'hour')
  const diffInDays = now.diff(date, 'day')

  if (diffInDays > 14) {
    return pastDate.year() === now.year()
      ? pastDate.format('MMM D')
      : pastDate.format('MMM D, YYYY')
  } else if (diffInDays >= 1) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
  } else if (diffInHours <= 23 && diffInHours >= 1) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`
  } else if (diffInMinutes <= 59 && diffInMinutes >= 1) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`
  }

  return 'just now'
}

const isClockUnit = (date: ConfigType) => {
  const unit = customRelativeTime(date)
  return unit.includes('second') || unit.includes('minute') || unit.includes('hour')
}

export const formattedFullDate = (input: ConfigType) =>
  dayjs(input).format('MMM D, YYYY, H:mm')

export const formattedRelativeDate = (
  input: ConfigType,
  options?: Partial<{ prefix: boolean }>
) => {
  if (options?.prefix) {
    return isClockUnit(input)
      ? customRelativeTime(input)
      : `on ${customRelativeTime(input)}`
  } else {
    return customRelativeTime(input)
  }
}
