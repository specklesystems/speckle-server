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

export type CreateVersionArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  accountId: string
  objectId: string
  message?: string
  sourceApplication?: string
}

// TODO: Once ruby codebase aligned with it, sketchup will consume this bridge too!
export class ServerBridge {
  private runMethod: (methodName: string, args: unknown[]) => Promise<unknown>
  public emitter: Emitter

  constructor(
    runMethod: (methodName: string, args: unknown[]) => Promise<unknown>,
    emitter: Emitter
  ) {
    this.runMethod = runMethod
    this.emitter = emitter
  }

  // NOTE: Overriden emit as we do not need to parse the data back - the Server bridge already parses it for us.
  emit(eventName: string, payload: Record<string, unknown>): void {
    const eventPayload = payload as unknown as Record<string, unknown>

    if (eventName === 'sendByBrowser')
      this.sendByBrowser(eventPayload as SendViaBrowserArgs)
    // we will switch to https://www.npmjs.com/package/@speckle/objectsender
    else if (eventName === 'receiveByBrowser')
      this.receiveByBrowser(eventPayload as ReceiveViaBrowserArgs)
    // Archicad is not likely to hit here yet!
    else return this.emitter.emit(eventName, eventPayload)
  }

  private async receiveByBrowser(eventPayload: ReceiveViaBrowserArgs) {
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
    await this.runMethod('afterGetObjects', args as unknown as unknown[])
  }

  /**
   * Internal server bridge method for sending data via the browser.
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
    ) // NOTE to dim

    // BEFORE as below
    // TODO: More of a question: why are we not sending multiple batches at once?
    // What's in a batch? etc. To look at optmizing this and not blocking the
    // main thread.
    // const promises = [] as Promise<Response>[]
    // sendObject.batches.forEach((batch) => {
    //   const formData = new FormData()
    //   formData.append(`batch-1`, new Blob([batch], { type: 'application/json' }))
    //   promises.push(
    //     fetch(`${serverUrl}/objects/${projectId}`, {
    //       method: 'POST',
    //       headers: { Authorization: 'Bearer ' + token },
    //       body: formData
    //     })
    //   )
    // })
    // await Promise.all(promises)

    const hostAppStore = useHostAppStore()

    const args: CreateVersionArgs = {
      modelCardId,
      projectId,
      modelId,
      accountId,
      objectId: rootCommitObjectId,
      sourceApplication: hostAppStore.hostAppName?.toLowerCase(),
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
        objectId: args.objectId,
        sourceApplication: hostAppStore.hostAppName,
        projectId: args.projectId
      }
    })
    return result?.data?.versionMutations?.create?.id
  }
}
