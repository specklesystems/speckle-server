import { EmailsEvents } from '@/modules/emails/domain/events'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { MaybeAsync } from '@speckle/shared'
import type Mail from 'nodemailer/lib/mailer'

type ListenOptions = {
  handler?: (email: Mail.Options) => MaybeAsync<void>
  times?: number
}

export const createEmailListener = async (
  options?: Partial<{
    destroyWhenNoListeners: boolean
  }>
) => {
  const eventBus = getEventBus()
  let collectedSends: Mail.Options[] = []
  let listenerQuitters: (() => void)[] = []

  // Global listener, tracks emails even if no listen() invoked
  const quitGlobal = eventBus.listen(
    EmailsEvents.PreparingToSend,
    async ({ payload }) => {
      collectedSends.push(payload.options)
    }
  )

  /**
   * Reset .listen() calls and collected sends (by default)
   */
  const reset = (
    options?: Partial<{
      listenersOnly: boolean
    }>
  ) => {
    listenerQuitters.forEach((quit) => quit())
    listenerQuitters = []

    if (!options?.listenersOnly) {
      collectedSends = []
    }
  }

  /**
   * Close all listeners
   */
  const destroy = async () => {
    quitGlobal()
    reset({ listenersOnly: true })
  }

  /**
   * Start a listening session w/ localized collected sends
   */
  const listen = (params: ListenOptions) => {
    let timesReceived = 0
    const localSends: Mail.Options[] = []

    const quit = eventBus.listen(EmailsEvents.PreparingToSend, async ({ payload }) => {
      await params.handler?.(payload.options)
      localSends.push(payload.options)
      timesReceived += 1

      if (params.times && timesReceived >= params.times) {
        await wrappedQuit()
      }
    })

    const wrappedQuit = async () => {
      quit()
      listenerQuitters.splice(listenerQuitters.indexOf(wrappedQuit), 1)

      // Destroy all listeners, if last one
      if (options?.destroyWhenNoListeners && listenerQuitters.length === 0) {
        await destroy()
      }
    }

    listenerQuitters.push(wrappedQuit)

    return {
      /**
       * Get sends collected during this listening session.
       */
      getSends: () => localSends.slice(),
      quit: wrappedQuit
    }
  }

  /**
   * Get all sends collected (even outside of listener sessions)
   */
  const getSends = () => collectedSends.slice()

  return {
    destroy,
    listen,
    getSends,
    reset
  }
}

export type TestEmailListener = Awaited<ReturnType<typeof createEmailListener>>
