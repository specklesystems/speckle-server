import type { Optional } from '@speckle/shared'
import type { ConfigType } from 'dayjs'
import dayjs from 'dayjs'
import { useUserTimezone } from '~/lib/core/composables/server'

const createDayjs = (date: ConfigType, tz: Optional<string>) => {
  const baseDate = dayjs(date)
  return tz ? baseDate.tz(tz) : baseDate
}

/**
 * Converts a given date input into a relative time string
 * @example
 * customRelativeTime('2023-07-16') - returns "Jul 16" or "Jul 16, 2023" if the year is different from the current year
 * customRelativeTime(new Date()) - returns "just now"
 */
const customRelativeTime = (
  date: ConfigType,
  now: ConfigType,
  tz: Optional<string>,
  capitalize?: boolean
): string => {
  const pastDate = createDayjs(date, tz)
  now = createDayjs(now, tz)

  const diffInMinutes = now.diff(pastDate, 'minute')
  const diffInHours = now.diff(pastDate, 'hour')
  const diffInDays = now.diff(pastDate, 'day')

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
const isTimeframe = (date: ConfigType, now: ConfigType, tz: Optional<string>) => {
  const unit = customRelativeTime(date, now, tz)
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
const formattedFullDate = (date: ConfigType, tz: Optional<string>): string =>
  createDayjs(date, tz).format('MMM D, YYYY, H:mm')

/**
 * Formats a given date input into a date string without time
 * @example
 * formattedDateOnly('2023-12-01') - returns "Dec 12, 2023"
 */
const formattedDateOnly = (date: ConfigType, tz: Optional<string>): string =>
  createDayjs(date, tz).format('MMM D, YYYY')

/**
 * Formats a given date input into a relative time string with optional prefix
 * @example
 * Assuming today is January 1st 2024
 * formattedRelativeDate('2023-12-01') - returns "Dec 12, 2023"
 * formattedRelativeDate('2023-12-01', { prefix: true }) - returns "on Dec 12, 2023"
 * formattedRelativeDate('2023-12-31') -  returns "1 day ago"
 * formattedRelativeDate('2023-12-31', { prefix: true }) -  returns "1 day ago"
 */
const formattedRelativeDate = (
  date: ConfigType,
  now: ConfigType,
  tz: Optional<string>,
  options?: Partial<{ prefix: boolean; capitalize: boolean }>
): string => {
  if (options?.prefix) {
    return isTimeframe(date, now, tz)
      ? customRelativeTime(date, now, tz, options?.capitalize)
      : `on ${customRelativeTime(date, now, tz)}`
  } else {
    return customRelativeTime(date, now, tz, options?.capitalize)
  }
}

// Remembering and reusing same now() value in SSR and CSR to avoid hydration mismatches
const useNowState = () => useState('now', () => new Date())

/**
 * Relative/absolute date formatting utilities that are SSR friendly and also respect the user's time zone/locale
 */
export const useDateFormatters = () => {
  const state = useNowState()
  const timeZone = useUserTimezone()
  const { $isAppHydrated } = useNuxtApp()

  return {
    /**
     * Formats a given date input into a relative time string with optional prefix
     * @example
     * Assuming today is January 1st 2024
     * formattedRelativeDate('2023-12-01') - returns "Dec 12, 2023"
     * formattedRelativeDate('2023-12-01', { prefix: true }) - returns "on Dec 12, 2023"
     * formattedRelativeDate('2023-12-31') -  returns "1 day ago"
     * formattedRelativeDate('2023-12-31', { prefix: true }) -  returns "1 day ago"
     */
    formattedRelativeDate: (
      date: ConfigType,
      options?: Partial<{ prefix: boolean; capitalize: boolean; now: ConfigType }>
    ): string => {
      // during SSR and hydration use static now, afterwards use a fresh one each time
      // (unless if specific one fed in)
      const now = options?.now || ($isAppHydrated.value ? new Date() : state.value)
      return formattedRelativeDate(date, now, timeZone.value, options)
    },
    /**
     * Formats a given date input into a full date string with our default format
     * @example
     * formattedFullDate('2023-12-01') - returns "Dec 12, 2023"
     */
    formattedFullDate: (date: ConfigType): string =>
      formattedFullDate(date, timeZone.value),
    /**
     * Formats a given date input into a date string without time
     * @example
     * formattedDateOnly('2023-12-01') - returns "Dec 12, 2023"
     */
    formattedDateOnly: (date: ConfigType): string =>
      formattedDateOnly(date, timeZone.value)
  }
}
