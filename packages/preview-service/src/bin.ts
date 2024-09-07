import '@/bootstrap.js' // This has side-effects and has to be imported first

import { startServer } from '@/server/server.js'
import { startPreviewService } from '@/server/background.js'
import { db } from '@/clients/knex.js'

startServer({ db })
startPreviewService({ db })
