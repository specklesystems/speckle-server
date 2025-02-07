import { calculateObjectHash } from '@/modules/core/services/objects/management'

export function generateManyObjects(shitTon: number, noise: unknown) {
  shitTon = shitTon || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base: {
    id: string
    name: string
    noise: unknown
    __closure: Record<string, number>
  } = { id: '', name: 'base bastard 2', noise, __closure: {} }
  let k = 0

  for (let i = 0; i < shitTon; i++) {
    const baby = {
      id: '',
      name: `mr. ${i}`,
      nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [i + 42, i, i] },
      test: { value: i, secondValue: 'mallard ' + (i % 10) },
      similar: k,
      even: i % 2 === 0,
      objArr: [{ a: i }, { b: i * i }, { c: true }],
      noise,
      sortValueA: i,
      sortValueB: i * 0.42 * i
    }
    if (i % 3 === 0) k++

    getAnIdForThisOnePlease(baby)

    base.__closure[baby.id] = 1

    objs.push(baby)
  }

  getAnIdForThisOnePlease(base)
  return { commit: base, objs }
}

export function createManyObjects(num: number, noise?: unknown) {
  num = num || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base: {
    id: string
    name: string
    noise: unknown
    __closure: Record<string, number>
  } = { id: '', name: 'base bastard 2', noise, __closure: {} }
  objs.push(base)

  for (let i = 0; i < num; i++) {
    const baby = {
      id: '',
      name: `mr. ${i}`,
      nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [i + 42, i, i] }
    }
    getAnIdForThisOnePlease(baby)
    base.__closure[baby.id] = 1
    objs.push(baby)
  }
  getAnIdForThisOnePlease(base)
  return objs
}

/**
 *
 * @param obj An object, which will be mutated in place to have an id
 * @description Mutates the object in place to have an id. If the object already has an id, it will be left as is. If it does not, an id will be generated based on the object's contents (excluding the id field).
 */
export function getAnIdForThisOnePlease(obj: { id: string } & Record<string, unknown>) {
  obj.id = obj.id || calculateObjectHash(obj)
}

export const sleep = (ms: number) => {
  // logger.debug( `\t Sleeping ${ms}ms ` )
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

/**
 * Checks the response body for errors. To be used in expect assertions.
 * Will throw an error if 'errors' exist.
 * @param {*} res
 */
export function noErrors(res: unknown) {
  if (!res || typeof res !== 'object') {
    throw new Error(
      'Response is not in the expected structure. Please review the test.'
    )
  }
  if ('error' in res && res.error)
    throw new Error(`Failed GraphQL request: ${JSON.stringify(res.error)}`)
  if (
    'body' in res &&
    res.body &&
    typeof res.body === 'object' &&
    'errors' in res.body &&
    res.body.errors &&
    Array.isArray(res.body.errors) &&
    res.body.errors.length > 0
  )
    throw new Error(`Failed GraphQL request: ${JSON.stringify(res.body.errors)}`)
}
