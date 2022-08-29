import '../bootstrap'
import { sendSummaryEmails } from '@/modules/activitystream/services/summary'
import { initializeTransporter } from '@/modules/emails/utils/transporter'
import * as SendingService from '@/modules/emails/services/sending'

const main = async () => {
  await initializeTransporter()
  const numberOfDays = 365
  const end = new Date()
  const start = new Date(end.getTime())
  start.setDate(start.getDate() - numberOfDays)
  const sendResult = await sendSummaryEmails(start, end, SendingService.sendEmail)

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
