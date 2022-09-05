import '../bootstrap'
import { initializeQueue } from '@/modules/notifications/services/queue'
import { sendActivityNotifications } from '@/modules/activitystream/services/summary'

const main = async () => {
  initializeQueue()
  const numberOfDays = 17
  const end = new Date()
  const start = new Date(end.getTime())
  start.setDate(start.getDate() - numberOfDays)
  const sendResult = await sendActivityNotifications(start, end)

  console.log(sendResult)
}
main()
  .then(() => {
    console.log('created')
    process.exit(0)
  })
  .catch((err) => {
    console.log('failed', err)
    process.exit(1)
  })
