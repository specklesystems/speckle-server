import type { ConversionResult } from '~/lib/conversions/conversionResult'
import type { ProgressStage } from '@speckle/objectloader'
import ObjectLoader from '@speckle/objectloader'
import { send, type Base } from '@speckle/objectsender'
import { provideApolloClient, useMutation } from '@vue/apollo-composable'
import {
  versionDetailsQuery,
  markReceivedVersionMutation,
  createVersionMutation
} from '~/lib/graphql/mutationsAndQueries'
import { storeToRefs } from 'pinia'
import type { DUIAccount } from '~/store/accounts'
import { useAccountStore } from '~/store/accounts'
import { useHostAppStore } from '~/store/hostApp'
import type { Emitter } from 'nanoevents'
import { useDesktopService } from '~/lib/core/composables/desktopService'
import type { ToastNotification } from '@speckle/ui-components'
import { ToastNotificationType } from '@speckle/ui-components'

export type SendBatchViaBrowserArgs = {
  modelCardId: string
  projectId: string
  token: string
  serverUrl: string
  batch: string
  currentBatch: number
  totalBatch: number
  referencedObjectId: string
}

export type CreateVersionViaBrowserArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  token: string
  serverUrl: string
  accountId: string
  message: string
  referencedObjectId: string
  sourceApplication: string
  sendConversionResults: ConversionResult[]
}

export type SendViaBrowserArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  token: string
  serverUrl: string
  accountId: string
  message: string
  sendConversionResults: ConversionResult[]
  sendObject: {
    id: string // the root object id which should be used for creating the version
    rootObject: object // NOTE to dim
  }
}

export type ReceiveViaBrowserArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  objectId: string
  accountId: string
  selectedVersionId: string
}

export type ReceiveViaDesktopServiceArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  objectId: string
  accountId: string
  selectedVersionId: string
  xmlConverterPath: string
  endpointVersion: string // i.e. v1, v2...
}

export type CreateVersionArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  accountId: string
  referencedObjectId: string
  message?: string
  sourceApplication?: string
}

export type ArchicadReceiveRequest = {
  accountId: string
  projectId: string
  referencedObject: string
  xmlConverterPath: string
}

// TODO: Once ruby codebase aligned with it, sketchup will consume this bridge too!
export class ArchicadBridge {
  public emitter: Emitter

  constructor(emitter: Emitter) {
    this.emitter = emitter
  }

  // NOTE: Overriden emit as we do not need to parse the data back - the Server bridge already parses it for us.
  emit(
    eventName: string,
    payload: Record<string, unknown>,
    runMethod: (
      methodName: string,
      args: unknown[],
      shouldTimeout: boolean
    ) => Promise<unknown>
  ): void {
    const eventPayload = payload as unknown as Record<string, unknown>

    if (eventName === 'sendByBrowser')
      this.sendByBrowser(eventPayload as SendViaBrowserArgs)
    // we will switch to https://www.npmjs.com/package/@speckle/objectsender
    else if (eventName === 'sendBatchViaBrowser')
      this.sendBatchViaBrowser(eventPayload as SendBatchViaBrowserArgs, runMethod)
    else if (eventName === 'createVersionViaBrowser')
      this.createVersionViaBrowser(eventPayload as CreateVersionViaBrowserArgs)
    else if (eventName === 'receiveByBrowser')
      this.receiveByBrowser(eventPayload as ReceiveViaBrowserArgs, runMethod)
    else if (eventName === 'receiveByDesktopService')
      this.receiveByDesktopService(
        eventPayload as ReceiveViaDesktopServiceArgs,
        runMethod
      )
    // Archicad is not likely to hit here yet!
    else return this.emitter.emit(eventName, eventPayload)
  }

  private async receiveByDesktopService(
    eventPayload: ReceiveViaDesktopServiceArgs,
    runMethod: (
      methodName: string,
      args: unknown[],
      shouldTimeout: boolean
    ) => Promise<unknown>
  ) {
    const { pingDesktopService } = useDesktopService()

    // 1 - Ping the desktop service to understand it is running
    const isDesktopServiceAvailable = await pingDesktopService()

    const hostAppStore = useHostAppStore()

    if (!isDesktopServiceAvailable) {
      const notification: ToastNotification = {
        title: 'Desktop service unavailable',
        description:
          'Falling back to a slower load process because the desktop service is not running.',
        type: ToastNotificationType.Info
      }
      hostAppStore.setNotification(notification)
      // 1.1 - No - fallback to receiveByBrowser
      return this.receiveByBrowser(
        {
          modelCardId: eventPayload.modelCardId,
          accountId: eventPayload.accountId,
          projectId: eventPayload.projectId,
          modelId: eventPayload.modelId,
          objectId: eventPayload.objectId,
          selectedVersionId: eventPayload.selectedVersionId
        },
        runMethod
      )
    }

    const accountStore = useAccountStore()
    const { accounts } = storeToRefs(accountStore)
    const account = accounts.value.find(
      (acc) => acc.accountInfo.id === eventPayload.accountId
    )
    provideApolloClient((account as DUIAccount).client)

    // useQuery cannot use in outside of VueComponent.
    const result = await (account as DUIAccount).client.query({
      query: versionDetailsQuery,
      variables: {
        projectId: eventPayload.projectId,
        versionId: eventPayload.selectedVersionId,
        modelId: eventPayload.modelId
      }
    })

    // 1.2 - Yes - continue
    const body: ArchicadReceiveRequest = {
      accountId: eventPayload.accountId,
      projectId: eventPayload.projectId,
      referencedObject: result.data.project.model.version.referencedObject,
      xmlConverterPath: eventPayload.xmlConverterPath
    }

    // 2 - POST the desktop service with formatted endpoint
    try {
      hostAppStore.handleModelProgressEvents({
        modelCardId: eventPayload.modelCardId,
        progress: {
          status: 'Conversion has started, Archicad may be unresponsive for a while.'
        }
      })

      const res = await fetch(
        `http://localhost:29364/${eventPayload.endpointVersion}/archicad-receive`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' }
        }
      )

      if (!res.ok) {
        const errorText = await res.text() // it is weird tho we can use .json() when it is not ok, it just throws and as below is OK.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new Error(`${JSON.parse(errorText).detail as string}`)
      }

      const path = (await res.json()) as unknown

      await runMethod(
        'afterGsmConverter',
        [
          eventPayload.modelCardId,
          result.data.project.model.version.sourceApplication,
          path
        ] as unknown as unknown[],
        false
      )
    } catch (error) {
      const notification: ToastNotification = {
        title: 'Load failed',
        description: error as string,
        type: ToastNotificationType.Danger
      }
      hostAppStore.setNotification(notification)
      hostAppStore.handleModelProgressEvents({
        modelCardId: eventPayload.modelCardId,
        progress: undefined
      })
    }
  }

  private async receiveByBrowser(
    eventPayload: ReceiveViaBrowserArgs,
    runMethod: (
      methodName: string,
      args: unknown[],
      shouldTimeout: boolean
    ) => Promise<unknown>
  ) {
    const accountStore = useAccountStore()
    const hostAppStore = useHostAppStore()
    const { accounts } = storeToRefs(accountStore)
    const account = accounts.value.find(
      (acc) => acc.accountInfo.id === eventPayload.accountId
    )
    provideApolloClient((account as DUIAccount).client)

    // useQuery cannot use in outside of VueComponent.
    const result = await (account as DUIAccount).client.query({
      query: versionDetailsQuery,
      variables: {
        projectId: eventPayload.projectId,
        versionId: eventPayload.selectedVersionId,
        modelId: eventPayload.modelId
      }
    })

    const loader = new ObjectLoader({
      serverUrl: account?.accountInfo.serverInfo.url as string,
      token: account?.accountInfo.token as string,
      streamId: eventPayload.projectId,
      objectId: result.data.project.model.version.referencedObject
    })

    const updateProgress = (e: {
      stage: ProgressStage
      current: number
      total: number
    }) => {
      const progress = e.current / e.total
      hostAppStore.handleModelProgressEvents({
        modelCardId: eventPayload.modelCardId,
        progress: { status: 'Downloading', progress }
      })
    }

    // eslint-disable-next-line @typescript-eslint/await-thenable
    const rootObj = await loader.getAndConstructObject(updateProgress)
    const args = [
      eventPayload.modelCardId,
      result.data.project.model.version.sourceApplication,
      rootObj
    ]

    const markReceived = provideApolloClient((account as DUIAccount).client)(() =>
      useMutation(markReceivedVersionMutation)
    )

    await markReceived.mutate({
      input: {
        versionId: eventPayload.selectedVersionId,
        projectId: eventPayload.projectId,
        sourceApplication: hostAppStore.hostAppName as string
      }
    })

    hostAppStore.handleModelProgressEvents({
      modelCardId: eventPayload.modelCardId,
      progress: { status: 'Converting' }
    })

    // CONVERSION WILL START AFTER THAT
    await runMethod('afterGetObjects', args as unknown as unknown[])
  }

  private queuedPromises = {} as Record<string, Promise<Response>[]>

  /**
   * Internal server method for sending batch data via REST api.
   * Whenever batches are completed it triggers to host application to notify it is done.
   * To be able to use this function properly, expected objects in batch must have hashed (speckle ids generated, detached, chucked bla bla) on connector.
   * @param eventPayload
   */
  private async sendBatchViaBrowser(
    eventPayload: SendBatchViaBrowserArgs,
    runMethod: (
      methodName: string,
      args: unknown[],
      shouldTimeout: boolean
    ) => Promise<unknown>
  ) {
    const {
      serverUrl,
      token,
      projectId,
      modelCardId,
      batch,
      totalBatch,
      currentBatch,
      referencedObjectId
    } = eventPayload
    if (!this.queuedPromises[modelCardId]) {
      this.queuedPromises[modelCardId] = []
    }
    const formData = new FormData()
    formData.append(`batch-1`, new Blob([batch], { type: 'application/json' }))
    this.queuedPromises[modelCardId].push(
      fetch(`${serverUrl}/objects/${projectId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      })
    )

    // 🚀 ready to send!!!!
    if (currentBatch === totalBatch) {
      const start = performance.now()
      for (let i = 0; i < this.queuedPromises[modelCardId].length; i++) {
        const isLast = i === this.queuedPromises[modelCardId].length - 1
        // Emit progress update for each resolved promise
        this.emitter.emit('setModelProgress', {
          modelCardId,
          progress: {
            status: 'Uploading',
            progress: isLast ? 0 : (i + 1) / this.queuedPromises[modelCardId].length
          }
        } as unknown as string)
        await this.queuedPromises[modelCardId][i] // Wait for the current promise to resolve
      }
      this.queuedPromises[modelCardId] = []
      console.log(`🚀 Upload is completed in ${(performance.now() - start) / 1000} s!`)
      const args = [eventPayload.modelCardId, referencedObjectId]
      await runMethod('afterSendObjects', args as unknown as unknown[])
    }
  }

  /**
   * Whenever we make sure we sent every object to the server, we can safely call this function from connector to trigger version create and populate conversion reports.
   * @param eventPayload
   */
  private async createVersionViaBrowser(eventPayload: CreateVersionViaBrowserArgs) {
    const {
      projectId,
      accountId,
      modelId,
      modelCardId,
      referencedObjectId,
      message,
      sourceApplication,
      sendConversionResults
    } = eventPayload
    const versionId = await this.createVersion({
      modelCardId,
      projectId,
      modelId,
      accountId,
      referencedObjectId,
      sourceApplication,
      message
    })
    const hostAppStore = useHostAppStore()
    hostAppStore.setModelSendResult({
      modelCardId,
      versionId: versionId as string,
      sendConversionResults
    })
  }

  /**
   * Internal server bridge method for sending data via object sender.
   * @param eventPayload
   */
  private async sendByBrowser(eventPayload: SendViaBrowserArgs) {
    const {
      serverUrl,
      token,
      projectId,
      accountId,
      modelId,
      modelCardId,
      sendObject,
      sendConversionResults,
      message
    } = eventPayload
    this.emitter.emit('setModelProgress', {
      modelCardId,
      progress: {
        status: 'Uploading',
        progress: 0
      }
    } as unknown as string)

    const { hash: rootCommitObjectId } = await send(
      sendObject.rootObject as unknown as Base,
      {
        serverUrl,
        projectId,
        token
      }
    )

    const hostAppStore = useHostAppStore()

    const hostAppName = `Archicad ${hostAppStore.hostAppVersion}`

    const args: CreateVersionArgs = {
      modelCardId,
      projectId,
      modelId,
      accountId,
      referencedObjectId: rootCommitObjectId,
      sourceApplication: hostAppName,
      message: message || `send from ${hostAppStore.hostAppName?.toLowerCase()}`
    }
    const versionId = await this.createVersion(args)

    // TODO: Alignment needed
    hostAppStore.setModelSendResult({
      modelCardId: args.modelCardId,
      versionId: versionId as string,
      sendConversionResults
    })
  }

  private async createVersion(args: CreateVersionArgs) {
    const accountStore = useAccountStore()
    const { accounts } = storeToRefs(accountStore)
    const account = accounts.value.find((acc) => acc.accountInfo.id === args.accountId)

    const createVersion = provideApolloClient((account as DUIAccount).client)(() =>
      useMutation(createVersionMutation)
    )

    const hostAppStore = useHostAppStore()

    const result = await createVersion.mutate({
      input: {
        modelId: args.modelId,
        objectId: args.referencedObjectId,
        sourceApplication: hostAppStore.hostAppName,
        projectId: args.projectId
      }
    })
    return result?.data?.versionMutations?.create?.id
  }
}
