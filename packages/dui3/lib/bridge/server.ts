import type { ConversionResult } from '~/lib/conversions/conversionResult'
import type { ProgressStage } from '@speckle/objectloader'
import ObjectLoader from '@speckle/objectloader'
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
import { uniqueId } from 'lodash-es'
import { BaseBridge } from '~/lib/bridge/base'

type SendViaBrowserArgs = {
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
    totalChildrenCount: number
    batches: string[]
  }
}

type ReceiveViaBrowserArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  objectId: string
  accountId: string
  selectedVersionId: string
}

type CreateVersionArgs = {
  modelCardId: string
  projectId: string
  modelId: string
  accountId: string
  objectId: string
  message?: string
  sourceApplication?: string
}

export abstract class ServerBridge extends BaseBridge {
  protected abstract execMethod(
    methodName: string,
    requestId: string,
    args: unknown[]
  ): void
  private requests = {} as Record<
    string,
    {
      resolve: (value: unknown) => void
      reject: (reason: string | Error) => void
      rejectTimerId: number
    }
  >

  public TIMEOUT_MS = 5000
  public NON_TIMEOUT_METHODS = ['send', 'afterGetObjects']
  public bindingName: string
  constructor(bindingName: string) {
    super()
    this.bindingName = bindingName
  }

  // NOTE: Overriden emit as we do not need to parse the data back - the Sketchup bridge already parses it for us.
  emit(eventName: string, payload: string): void {
    const eventPayload = payload as unknown as Record<string, unknown>

    if (eventName === 'sendViaBrowser')
      this.sendViaBrowser(eventPayload as SendViaBrowserArgs)
    else if (eventName === 'receiveViaBrowser')
      this.receiveViaBrowser(eventPayload as ReceiveViaBrowserArgs)

    return this.emitter.emit(eventName, eventPayload)
  }

  /**
   * Internal calls to Sketchup.
   * @param methodName
   * @param args
   */
  public async runMethod(methodName: string, args: unknown[]): Promise<unknown> {
    const requestId = uniqueId(this.bindingName)
    this.execMethod(methodName, requestId, args)

    return new Promise((resolve, reject) => {
      this.requests[requestId] = {
        resolve,
        reject,
        rejectTimerId: window.setTimeout(
          () => {
            reject(
              `Sketchup response timed out for ${methodName} - did not receive anything back in good time (${this.TIMEOUT_MS}ms).`
            )
            delete this.requests[requestId]
          },
          this.NON_TIMEOUT_METHODS.includes(methodName) ? 3600000 : this.TIMEOUT_MS
        )
      }
    })
  }

  public receiveResponse(requestId: string, data: object) {
    console.log('receiveResponse', requestId, data)
    console.log('requests', this.requests)

    if (!this.requests[requestId])
      throw new Error(`No request found with id ${requestId}.`)

    const request = this.requests[requestId]
    try {
      // eslint-disable-next-line no-prototype-builtins
      if (data && data.hasOwnProperty('error')) {
        console.error(data)
        throw new Error(`Error running ${requestId}. See log above.`)
      }

      request.resolve(data)
    } catch (e) {
      request.reject(e as Error)
    } finally {
      window.clearTimeout(request.rejectTimerId)
      delete this.requests[requestId]
    }
  }

  private async receiveViaBrowser(eventPayload: ReceiveViaBrowserArgs) {
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

    // CONVERSION WILL START AFTER THAT
    await this.runMethod('afterGetObjects', args as unknown as unknown[])
  }

  /**
   * Internal sketchup method for sending data via the browser.
   * @param eventPayload
   */
  private async sendViaBrowser(eventPayload: SendViaBrowserArgs) {
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
    this.emit('setModelProgress', {
      modelCardId,
      progress: {
        status: 'Uploading',
        progress: 0
      }
    } as unknown as string)
    // TODO: More of a question: why are we not sending multiple batches at once?
    // What's in a batch? etc. To look at optmizing this and not blocking the
    // main thread.
    const promises = [] as Promise<Response>[]
    sendObject.batches.forEach((batch) => {
      const formData = new FormData()
      formData.append(`batch-1`, new Blob([batch], { type: 'application/json' }))
      promises.push(
        fetch(`${serverUrl}/objects/${projectId}`, {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + token },
          body: formData
        })
      )
    })
    await Promise.all(promises)

    const hostAppStore = useHostAppStore()

    const args: CreateVersionArgs = {
      modelCardId,
      projectId,
      modelId,
      accountId,
      objectId: sendObject.id,
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

  public async createVersion(args: CreateVersionArgs) {
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

  public openUrl(url: string) {
    window.open(url)
  }
}
