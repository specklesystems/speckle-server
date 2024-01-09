/* istanbul ignore file */
// const { logger } = require('@/logging/logging')
const crypto = require('crypto')

function generateManyObjects(shitTon, noise) {
  shitTon = shitTon || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base = { name: 'base bastard 2', noise, __closure: {} }
  // objs.push( base )
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

    getAnIdForThisOnePlease(baby)

    base.__closure[baby.id] = 1

    objs.push(baby)
  }

  getAnIdForThisOnePlease(base)
  return { commit: base, objs }
}

function createManyObjects(num, noise) {
  num = num || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base = { name: 'base bastard 2', noise, __closure: {} }
  objs.push(base)

  for (let i = 0; i < num; i++) {
    const baby = {
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

exports.createManyObjects = createManyObjects

function getAnIdForThisOnePlease(obj) {
  obj.id = obj.id || crypto.createHash('md5').update(JSON.stringify(obj)).digest('hex')
}

exports.generateManyObjects = generateManyObjects
exports.getAnIdForThisOnePlease = getAnIdForThisOnePlease

exports.sleep = (ms) => {
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
function noErrors(res) {
  if (res.error) throw new Error(`Failed GraphQL request: ${JSON.stringify(res.error)}`)
  if ('errors' in res.body)
    throw new Error(`Failed GraphQL request: ${JSON.stringify(res.body.errors)}`)
}
exports.noErrors = noErrors
