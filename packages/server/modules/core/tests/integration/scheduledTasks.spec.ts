import { db } from '@/db/knex'
import {
  acquireTaskLockFactory,
  releaseTaskLockFactory
} from '@/modules/core/repositories/scheduledTasks'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('scheduledTasks repositories @core', () => {
  describe('acquireTaskLockFactory creates a function, that', () => {
    it('returns the inserted task lock', async () => {
      const taskLock = {
        taskName: cryptoRandomString({ length: 10 }),
        lockExpiresAt: new Date()
      }
      const storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
    })
    it('acquires lock if the previous lock for the taskName has expired', async () => {
      const taskLock = {
        taskName: cryptoRandomString({ length: 10 }),
        lockExpiresAt: new Date(2000, 0, 1)
      }
      let storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
      taskLock.lockExpiresAt = new Date(2099, 12, 31)

      storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
    })
    it('returns null if the previous lock for the task name has not expired', async () => {
      const taskLock = {
        taskName: cryptoRandomString({ length: 10 }),
        lockExpiresAt: new Date(2099, 12, 31)
      }
      let storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
      taskLock.lockExpiresAt = new Date(2199, 12, 31)

      storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).to.be.null
    })
  })
  describe('releaseTaskLockFactory creates a function, that', () => {
    it('releases a lock by name', async () => {
      const taskLock = {
        taskName: cryptoRandomString({ length: 10 }),
        lockExpiresAt: new Date(2099, 12, 31)
      }
      let storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
      taskLock.lockExpiresAt = new Date(2199, 12, 31)

      storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).to.be.null
      await releaseTaskLockFactory({ db })(taskLock)

      storedTaskLock = await acquireTaskLockFactory({ db })(taskLock)
      expect(storedTaskLock).deep.equal(taskLock)
    })
  })
})
