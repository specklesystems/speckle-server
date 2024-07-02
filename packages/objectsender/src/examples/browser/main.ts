import { send, Base, type SendResult, Detach, Chunkable } from '../../index'
import { times } from '#lodash'
import { createCommit } from './utils'

interface ExampleAppWindow extends Window {
  send: typeof import('../../index').send
  loadData: () => Promise<void>
}

const appWindow = window as unknown as ExampleAppWindow

appWindow.send = send

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
  const projectId = localStorage.getItem('projectId')

  if (serverUrl) {
    setInputValue('serverUrl', serverUrl)
  }
  if (apiToken) {
    setInputValue('apiToken', apiToken)
  }
  if (projectId) {
    setInputValue('projectId', projectId)
  }
}

appWindow.loadData = async () => {
  const serverUrl = getInputValue('serverUrl')
  const apiToken = getInputValue('apiToken')
  const projectId = getInputValue('projectId')

  localStorage.setItem('serverUrl', serverUrl)
  localStorage.setItem('projectId', projectId)
  localStorage.setItem('apiToken', apiToken)

  setInputValue('result', '...', { valueKey: 'textContent' })

  const obj = generateTestObject()
  let res: SendResult | undefined = undefined

  try {
    res = await send(obj, {
      serverUrl,
      projectId,
      token: apiToken
    })

    await createCommit(res, { serverUrl, projectId, token: apiToken })
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e)
    setInputValue('result', msg, { valueKey: 'textContent' })
    throw e
  }

  const objectUrl = new URL(`/projects/${projectId}/models/${res.hash}`, serverUrl)
  const objectLink = objectUrl.toString()
  console.log(objectLink)

  setInputValue('result', objectLink, { valueKey: 'textContent' })
}

function generateTestObject() {
  return new Base({
    start: 'end',
    primitiveArray: Array(100).fill(1),
    normalObject: {
      hello: 'world',
      how: 'are',
      you: '?',
      inner: {
        pasta: 'pesto',
        qux: 'mux'
      }
    },
    '@detachedValue': new RandomFoo({
      '@nestedDetachedValue_1': new RandomFoo({
        '@nestedDetachedValue_2': new RandomFoo({
          '@nestedDetachedValue_3': new RandomFoo()
        })
      })
    }),
    '@detachedArray': [
      ...Array(100)
        .fill(0)
        .map(() => new RandomFoo({ bar: 'baz baz baz' }))
    ],
    detachedWithDecorator: new Collection<RandomFoo>('Collection of Foo', 'Foo', [
      ...Array(10)
        .fill(0)
        .map(() => new RandomFoo())
    ]),
    '@(10)chunkedArr': times(100, () => 42),
    some: new RandomJoe()
  })
}

class RandomFoo extends Base {
  constructor(props?: Record<string, unknown>) {
    super(props)
    this.noise = Math.random().toString(16)
  }
}

class RandomJoe extends Base {
  @Detach()
  @Chunkable(10)
  numbers: number[]

  constructor(props?: Record<string, unknown>) {
    super(props)
    this.numbers = times(100, () => 42)
  }
}

export class Collection<T extends Base> extends Base {
  @Detach()
  elements: T[]
  // eslint-disable-next-line camelcase
  speckle_type = 'Speckle.Core.Models.Collection'

  constructor(
    name: string,
    collectionType: string,
    elements: T[] = [],
    props?: Record<string, unknown>
  ) {
    super(props)
    this.name = name
    this.collectionType = collectionType
    this.elements = elements
  }
}
