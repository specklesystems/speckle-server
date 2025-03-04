import crypto from 'crypto'
import { get } from 'lodash'

/**
 * Generates an object containing the base object and an array of objects with an id. The base object will have a closure property which references all the other objects.
 * @description Differs from createManyObjects in that it returns an object with a 'commit' property (the base object) and a separate 'objs' property (an array of children objects). It also adds more properties to the objects.
 * @param shitTon the number of objects to generate
 * @param noise Any data to be added to the objects. Defaults to a random number between 0 and 100, inclusive
 * @returns An object. The 'commit' property is the base object with a closure property which references all the other ('children') objects. The 'objs' property is an array of children objects.
 */
export function generateManyObjects(shitTon: number, noise?: unknown) {
  shitTon = shitTon || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base: {
    id?: string
    name: string
    noise: unknown
    __closure: Record<string, number>
  } = { name: 'base bastard 2', noise, __closure: {} }
  let k = 0

  for (let i = 0; i < shitTon; i++) {
    const baby = {
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

    if (!getAnIdForThisOnePlease(baby)) continue //this will never be true, but typescript now knows baby definitely has an id

    base.__closure[baby.id] = 1

    objs.push(baby)
  }

  if (!getAnIdForThisOnePlease(base)) throw new Error('base object has no id') //this will never be true, but typescript now knows base definitely has an id
  return { commit: base, objs }
}

/**
 * Generates a bunch of objects with an id. The first object in the array will have a closure property which references all the other objects.
 * @description Differs from generateManyObjects in that it returns an array of objects, including a base object (at index 0).
 * @param num The number of objects to create.
 * @param noise Any arbitrary data which will be added to the objects. Defaults to a random number between 0 and 100, inclusive.
 * @returns An array of objects, including a base object (at index 0) with a closure property which references all the other objects.
 */
export function createManyObjects(num: number, noise?: unknown) {
  num = num || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base: {
    __closure: Record<string, number>
  } & Record<string, unknown> = { name: 'base bastard 2', noise, __closure: {} }

  for (let i = 0; i < num; i++) {
    const baby: Record<string, unknown> = {
      name: `mr. ${i}`,
      nest: { duck: i % 2 === 0, mallard: 'falsey', arr: [i + 42, i, i] }
    }

    if (!getAnIdForThisOnePlease(baby)) continue //this will never be true, but typescript now knows baby definitely has an id
    base.__closure[baby.id] = 1
    objs.push(baby)
  }
  if (!getAnIdForThisOnePlease(base)) return objs //this will never be true, but typescript now knows base definitely has an id
  objs.unshift(base)
  return objs
}

/**
 * Adds an 'id' property to an object if it doesn't already have one. The 'id' is a hash (md5) of the object.
 * @param obj This object is passed by reference and will be modified
 * @returns true. This is a hack to make typescript happy and eliminate the 'undefined' type from 'id'
 */
export function getAnIdForThisOnePlease(
  obj: Record<string, unknown>
): obj is Record<'id', string> & Record<string, unknown> {
  obj.id = obj.id || crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex')
  return true //HACK to make typescript happy and eliminate the 'undefined' type from 'id'
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
  const e = get(res, 'error')
  if (e) throw new Error(`Failed GraphQL request: ${JSON.stringify(e)}`)
  const bodyErrors = get(res, 'body.errors')
  if (bodyErrors)
    throw new Error(`Failed GraphQL request: ${JSON.stringify(bodyErrors)}`)
}
