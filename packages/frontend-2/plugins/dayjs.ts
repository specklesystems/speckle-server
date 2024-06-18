import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import duration from 'dayjs/plugin/duration.js'

export default defineNuxtPlugin(() => {
  dayjs.extend(relativeTime)
  dayjs.extend(localizedFormat)
  dayjs.extend(duration)
})
