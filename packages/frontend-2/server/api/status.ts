import { useRequestId } from '~/lib/core/composables/server'

export default defineEventHandler((event) => {
  const reqId = useRequestId({ event })
  return { status: 'ok', reqId }
})
