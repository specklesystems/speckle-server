import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

export default defineNuxtPlugin(() => {
  dayjs.extend(relativeTime)
  dayjs.extend(localizedFormat)
  dayjs.extend(duration)
  dayjs.extend(utc)
  dayjs.extend(timezone) // don't set default here, it's gonna apply to all sessions in SSR
})
