import { describe } from 'mocha'
import { ScheduledTasks } from '@/modules/core/dbSchema'
import { truncateTables } from '@/test/hooks'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import {
  scheduledCallbackWrapper,
  scheduleExecutionFactory
} from '@/modules/core/services/taskScheduler'
import { expect } from 'chai'
import { sleep } from '@/test/helpers'
import cryptoRandomString from 'crypto-random-string'
import { acquireTaskLockFactory } from '@/modules/core/repositories/scheduledTasks'
import { db } from '@/db/knex'

const acquireTaskLock = acquireTaskLockFactory({ db })
const scheduleExecution = scheduleExecutionFactory({ acquireTaskLock })

describe('Scheduled tasks @core', () => {
  describe('Task lock repository', () => {
    before(async () => {
      await truncateTables([ScheduledTasks.name])
    })
    it('can acquire task lock for a new function name', async () => {
      const taskName = cryptoRandomString({ length: 10 })
      const scheduledTask = { taskName, lockExpiresAt: new Date() }
      const lock = await acquireTaskLock(scheduledTask)
      expect(lock).to.be.deep.equal(scheduledTask)
    })
    it('can acquire task lock if previous lock has expired', async () => {
      const taskName = cryptoRandomString({ length: 10 })
      const oldTask = { taskName, lockExpiresAt: new Date() }
      await acquireTaskLock(oldTask)

      await sleep(100)
      const newTask = { taskName, lockExpiresAt: new Date() }
      const lock = await acquireTaskLock(newTask)
      expect(lock).to.be.deep.equal(newTask)
    })
    it('returns an invalid lock (null), if there is another lock in place', async () => {
      const taskName = cryptoRandomString({ length: 10 })
      const oldTask = {
        taskName,
        lockExpiresAt: new Date('2366-12-28 00:30:57.000+00')
      }
      await acquireTaskLock(oldTask)
      const newTask = { taskName, lockExpiresAt: new Date() }
      const lock = await acquireTaskLock(newTask)
      expect(lock).to.be.null
    })
  })
  describe('Task scheduler', () => {
    describe('scheduled callback wrapper function', () => {
      let callbackExecuted = false
      async function fakeCallback() {
        callbackExecuted = true
      }
      beforeEach(() => {
        callbackExecuted = false
      })
      it("doesn't invoke the callback if it aquires an invalid lock", async () => {
        expect(callbackExecuted).to.be.false
        const taskName = cryptoRandomString({ length: 10 })
        await scheduledCallbackWrapper(
          new Date(),
          taskName,
          100,
          fakeCallback,
          // fake lock aquire, always returning an invalid lock
          async () => null
        )
        expect(callbackExecuted).to.be.false
      })
      it('invokes the callback if a task lock is acquired', async () => {
        expect(callbackExecuted).to.be.false
        const taskName = cryptoRandomString({ length: 10 })
        await scheduledCallbackWrapper(
          new Date(),
          taskName,
          100,
          fakeCallback,
          // fake lock aquire, always returning an invalid lock
          async () => ({ taskName, lockExpiresAt: new Date() })
        )
        expect(callbackExecuted).to.be.true
      })
      it('handles all callback errors gracefully', async () => {
        expect(callbackExecuted).to.be.false
        const taskName = cryptoRandomString({ length: 10 })
        await scheduledCallbackWrapper(
          new Date(),
          taskName,
          100,
          async () => {
            callbackExecuted = true
            throw 'catch this'
          },
          // fake lock aquire, always returning an invalid lock
          async () => ({ taskName, lockExpiresAt: new Date() })
        )
        expect(callbackExecuted).to.be.true
      })
    })
    describe('schedule execution', () => {
      it('throws an InvalidArgimentError if the cron expression is not valid', async () => {
        const cronExpression = 'this is a borked cron expression'
        try {
          scheduleExecution(cronExpression, 'tick tick boom', async () => {
            return
          })
          throw new Error('this should have ')
        } catch (err) {
          expect(ensureError(err).message).to.equal(
            `The given cron expression ${cronExpression} is not valid`
          )
        }
      })
      it('returns a cron scheduled task instance if the config is valid', async () => {
        const cronExpression = '*/1000 * * * *'
        const task = scheduleExecution(cronExpression, 'tick tick boom', async () => {
          return
        })
        expect(task).to.not.be.null
      })
    })
  })
})
