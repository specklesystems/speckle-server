import { send, Base, type SendResult } from '../../index'
import { times } from '#lodash'

window.send = send

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

window.onload = () => {
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

window.loadData = async () => {
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
    '@(10)chunkedArr': times(100, () => 42)
  })
}

class RandomFoo extends Base {
  constructor(props?: Record<string, unknown>) {
    super(props)
    this.noise = Math.random().toString(16)
  }
}
