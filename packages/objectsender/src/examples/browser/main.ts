import { Base, Chunkable, Detach, send as objectSend } from '../../index'
import { createCommit, createProject } from './utils'

interface ExampleAppWindow extends Window {
  send: typeof objectSend
  loadData: () => Promise<void>
}

const appWindow = window as unknown as ExampleAppWindow

appWindow.send = objectSend

const setInputValue = (
  key: string,
  value: string,
  options?: Partial<{ valueKey: 'value' | 'textContent' }>
) => {
  const { valueKey = 'value' } = options || {}
  const input = document.getElementById(key) as HTMLInputElement | undefined
  if (!input) {
    console.error("Unexpectedly couldn't find core input: " + key)
    return
  }

  input[valueKey] = value
}

const getInputValue = (key: string) => {
  const input = document.getElementById(key) as HTMLInputElement | undefined
  if (!input) {
    throw new Error("Unexpectedly couldn't find core input: " + key)
  }

  return input.value
}

appWindow.onload = () => {
  const serverUrl = localStorage.getItem('serverUrl')
  const apiToken = localStorage.getItem('apiToken')

  if (serverUrl) {
    setInputValue('serverUrl', serverUrl)
  }
  if (apiToken) {
    setInputValue('apiToken', apiToken)
  }
}

appWindow.loadData = async () => {
  const serverUrl = getInputValue('serverUrl')
  const apiToken = getInputValue('apiToken')

  localStorage.setItem('serverUrl', serverUrl)
  localStorage.setItem('apiToken', apiToken)

  setInputValue('result', '...', { valueKey: 'textContent' })

  const projectOutput = (await createProject({
    serverUrl,
    token: apiToken
  })) as { data: { projectMutations: { create: { id: string } } } }
  const projectId = projectOutput.data.projectMutations.create.id
  console.log(`Created project: ${projectId}`)

  const sendParams = {
    projectId,
    token: apiToken,
    serverUrl
  }

  const t0 = performance.now()
  const numberOfElements = 800
  const meshesPerElement = 10
  const verticesPerMesh = 900

  const elements = Array(numberOfElements)
    .fill(0)
    .map(
      (v, i) =>
        new Asset(
          Array(meshesPerElement)
            .fill(0)
            .map(() => new Mesh(verticesPerMesh)),
          { name: `Asset ${i}` }
        )
    )

  const model = new Collection<Asset>(elements)
  let result = undefined
  let commitDetails: unknown = undefined
  try {
    result = await objectSend(model, sendParams)
    commitDetails = await createCommit(result, { ...sendParams, modelName: 'main' })
  } catch (e) {
    console.log(`Time of failure: ${new Date().toISOString()}`)
    console.log(`Error: ${JSON.stringify(e)}`)
    // log utc timestamp
    throw e
  }

  const t1 = performance.now()
  console.log(`Time taken: ${(t1 - t0) / 1000}s.`)
  console.log(`Result: ${JSON.stringify(result)}`)
  console.log(`Commit details: ${JSON.stringify(commitDetails)}`)
}
export class Mesh extends Base {
  @Detach()
  @Chunkable(31250)
  vertices: number[]

  @Detach()
  @Chunkable(62500)
  faces: number[]

  constructor(nVertices: number = 15, props?: Record<string, unknown>) {
    super(props)
    this.vertices = Array(nVertices)
      .fill(0)
      .map(() => Math.random() * 1000)
    this.faces = Array((nVertices / 3) * 4)
      .fill(0)
      .map(() => Math.floor(Math.random() * nVertices))
  }
}

export class Asset extends Base {
  @Detach()
  displayValue: Mesh[]

  constructor(meshes: Mesh[], props?: Record<string, unknown>) {
    super(props)
    this.displayValue = meshes
  }
}

export class Collection<T extends Base> extends Base {
  @Detach()
  elements: T[]

  constructor(elements: T[], props?: Record<string, unknown>) {
    super(props)
    this.elements = elements
  }
}
