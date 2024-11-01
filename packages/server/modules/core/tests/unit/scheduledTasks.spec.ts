import { describe } from 'mocha'
import { ensureError } from '@/modules/shared/helpers/errorHelper'
import {
  scheduledCallbackWrapper,
  scheduleExecutionFactory
} from '@/modules/core/services/taskScheduler'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Scheduled tasks @core', () => {
  describe('Task scheduler', () => {
    describe('scheduled callback wrapper function', () => {
      let callbackExecuted = false
      let lockReleased = false
      async function fakeCallback() {
        callbackExecuted = true
      }
      async function releaseTaskLock() {
        lockReleased = true
      }
      beforeEach(() => {
        callbackExecuted = false
        lockReleased = false
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
          async () => null,
          releaseTaskLock
        )
        expect(callbackExecuted).to.be.false
        expect(lockReleased).to.be.false
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
          async () => ({ taskName, lockExpiresAt: new Date() }),
          releaseTaskLock
        )
        expect(callbackExecuted).to.be.true
        expect(lockReleased).to.be.true
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
          async () => ({ taskName, lockExpiresAt: new Date() }),
          releaseTaskLock
        )
        expect(callbackExecuted).to.be.true
        expect(lockReleased).to.be.true
      })
    })
    describe('schedule execution', () => {
      const scheduleExecution = scheduleExecutionFactory({
        acquireTaskLock: async () => null,
        releaseTaskLock: async () => {}
      })
      it('throws an InvalidArgumentError if the cron expression is not valid', async () => {
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
