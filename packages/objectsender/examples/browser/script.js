import { send, Base } from './objectsender.web.js'

window.send = send

window.onload = (e) => {
  const s = localStorage.getItem('serverUrl')
  const t = localStorage.getItem('apiToken')
  const p = localStorage.getItem('projectId')
  if (s) {
    document.getElementById('serverUrl').value = s
  }
  if (t) {
    document.getElementById('apiToken').value = t
  }
  if (s) {
    document.getElementById('projectId').value = p
  }
}

window.loadData = async () => {
  const s = document.getElementById('serverUrl').value
  const t = document.getElementById('apiToken').value
  const p = document.getElementById('projectId').value

  localStorage.setItem('serverUrl', s)
  localStorage.setItem('projectId', p)
  localStorage.setItem('apiToken', t)

  document.getElementById('result').textContent = '...'

  const obj = generateTestObject()
  const res = await send(obj, {
    serverUrl: s,
    projectId: p,
    token: t
  })

  const objectLink = `${s}/projects/${p}/models/${res.hash}`
  console.log(objectLink)
  document.getElementById('result').textContent = objectLink
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
        .map((_) => new RandomFoo({ bar: 'baz baz baz' }))
    ],
    '@(10)chunkedArr': [...Array(100).fill(42)]
  })
}

class RandomFoo extends Base {
  constructor(props) {
    super(props)
    this.noise = Math.random().toString(16)
  }
}
