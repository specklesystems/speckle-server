import { Consumer, Message, MessageManager, Producer, QueueManager } from 'redis-smq'
import {
  IConfig,
  TQueueParams,
  TConsumerMessageHandler,
  TQueueRateLimit
} from 'redis-smq/dist/types'
import { RedisClientName } from 'redis-smq-common/dist/types'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { RedisOptions } from 'ioredis'

export const baseConfig = (): IConfig => ({
  redis: {
    client: RedisClientName.IOREDIS,
    options: getRedisUrl() as unknown as RedisOptions
  }
})

/**
 * Async wrapper for QueueManager.createInstance
 */
export async function createQueueManagerAsync(config: IConfig) {
  return new Promise<QueueManager>((resolve, reject) => {
    QueueManager.createInstance(config, (err, manager) => {
      if (err || !manager) {
        err ||= new Error('QueueManager unexpectedly undefined')
        return reject(err)
      }

      return resolve(manager)
    })
  })
}

/**
 * Async wrapper for MessageManager.createInstance
 */
export async function createMessageManagerAsync(config: IConfig) {
  return new Promise<MessageManager>((resolve, reject) => {
    MessageManager.createInstance(config, (err, manager) => {
      if (err || !manager) {
        err ||= new Error('MessageManager unexpectedly undefined')
        return reject(err)
      }

      return resolve(manager)
    })
  })
}

/**
 * Async wrapper for queueManager.queue.create()
 */
export async function createQueueAsync(
  manager: QueueManager,
  queue: string | TQueueParams,
  priorityQueuing = false
) {
  return new Promise<void>((resolve, reject) => {
    manager.queue.create(queue, priorityQueuing, (err) => {
      if (err) {
        return reject(err)
      }

      resolve()
    })
  })
}

/**
 * Create Producer and invoke run()
 */
export async function createAndInitProducer() {
  return new Promise<Producer>((resolve, reject) => {
    const producer = new Producer()
    producer.run((err) => {
      if (err) return reject(err)
      resolve(producer)
    })
  })
}

/**
 * Produce message and return the message ID
 */
export async function produceMessageAsync(producer: Producer, message: Message) {
  return new Promise<string>((resolve, reject) => {
    producer.produce(message, (err) => {
      const msgId = message.getId()
      if (err || !msgId) {
        err ||= new Error('Produced message has an undefined ID')
        return reject(err)
      }

      resolve(msgId)
    })
  })
}

/**
 * Initialize new consumer
 */
export async function startConsumption(
  queue: string | TQueueParams,
  handler: TConsumerMessageHandler
): Promise<Consumer> {
  const consumer = new Consumer()

  // Init consumption
  await new Promise<void>((resolve, reject) => {
    consumer.consume(queue, handler, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })

  // Run consumer
  await new Promise<void>((resolve, reject) => {
    consumer.run((err) => {
      if (err) return reject(err)
      resolve()
    })
  })

  return consumer
}

/**
 * Set rate limit settings
 */
export async function setRateLimit(
  queueManager: QueueManager,
  queue: string | TQueueParams,
  limits: TQueueRateLimit
) {
  await new Promise<void>((resolve, reject) => {
    queueManager.queueRateLimit.set(queue, limits, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}

export async function shutdownConsumer(consumer: Consumer) {
  await new Promise<boolean>((resolve, reject) => {
    consumer.shutdown((err, reply) => {
      if (err) return reject(err)
      resolve(!!reply)
    })
  })
}
