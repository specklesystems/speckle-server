import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * Converts a given date input into a relative time string
 * @example
 * customRelativeTime('2023-07-16') - returns "Jul 16" or "Jul 16, 2023" if the year is different from the current year
 * customRelativeTime(new Date()) - returns "just now"
 */
const customRelativeTime = (date: ConfigType, capitalize?: boolean): string => {
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

  return capitalize ? 'Just now' : 'just now'
}

/**
 * Determines if the given date input is using timeframe formatting
 * @example
 * isTimeframe('2023-07-16') - returns false
 * isTimeframe(new Date()) - returns true or false depending on the current time
 */
const isTimeframe = (date: ConfigType) => {
  const unit = customRelativeTime(date)
  return (
    unit.includes('second') ||
    unit.includes('minute') ||
    unit.includes('hour') ||
    unit.includes('day') ||
    unit.includes('just now')
  )
}

/**
 * Formats a given date input into a full date string with our default format
 * @example
 * formattedFullDate('2023-12-01') - returns "Dec 12, 2023"
 */
export const formattedFullDate = (date: ConfigType): string =>
  dayjs(date).format('MMM D, YYYY, H:mm')

/**
 * Formats a given date input into a relative time string with optional prefix
 * @example
 * Assuming today is January 1st 2024
 * formattedRelativeDate('2023-12-01') - returns "Dec 12, 2023"
 * formattedRelativeDate('2023-12-01', { prefix: true }) - returns "on Dec 12, 2023"
 * formattedRelativeDate('2023-12-31') -  returns "1 day ago"
 * formattedRelativeDate('2023-12-31', { prefix: true }) -  returns "1 day ago"
 */
export const formattedRelativeDate = (
  date: ConfigType,
  options?: Partial<{ prefix: boolean; capitalize: boolean }>
): string => {
  if (options?.prefix) {
    return isTimeframe(date)
      ? customRelativeTime(date, options?.capitalize)
      : `on ${customRelativeTime(date)}`
  } else {
    return customRelativeTime(date, options?.capitalize)
  }
}
