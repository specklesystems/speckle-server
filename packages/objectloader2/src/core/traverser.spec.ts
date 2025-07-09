import { describe, expect, test } from 'vitest'
import { ObjectLoader2 } from './objectLoader2.js'
import Traverser from './traverser.js'
import { Base } from '../types/types.js'

describe('Traverser', () => {
  test('root and two children with referenceId', async () => {
    const root = `{
  "list": [{
    "speckle_type": "reference",
    "referencedId": "0e61e61edee00404ec6e0f9f594bce24",
    "__closure": null
  }],
  "list2": [{
    "speckle_type": "reference",
    "referencedId": "f70738e3e3e593ac11099a6ed6b71154",
    "__closure": null
  }],
  "arr": null,
  "detachedProp": null,
  "detachedProp2": null,
  "attachedProp": null,
  "crazyProp": null,
  "applicationId": "1",
  "speckle_type": "Speckle.Core.Tests.Unit.Models.BaseTests+SampleObjectBase2",
  "dynamicProp": 123,
  "id": "efeadaca70a85ae6d3acfc93a8b380db",
  "__closure": {
    "0e61e61edee00404ec6e0f9f594bce24": 100,
    "f70738e3e3e593ac11099a6ed6b71154": 100
  }
}`

    const list1 = `{
  "data": [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
  "applicationId": null,
  "speckle_type": "Speckle.Core.Models.DataChunk",
  "id": "0e61e61edee00404ec6e0f9f594bce24"
}`

    const list2 = `{
  "data": [1.0, 10.0],
  "applicationId": null,
  "speckle_type": "Speckle.Core.Models.DataChunk",
  "id": "f70738e3e3e593ac11099a6ed6b71154"
}`

    const rootObj = JSON.parse(root) as Base
    const list1Obj = JSON.parse(list1) as Base
    const list2Obj = JSON.parse(list2) as Base

    const loader = ObjectLoader2.createFromObjects([rootObj, list1Obj, list2Obj])

    const traverser = new Traverser(loader)
    const r = await traverser.traverse()
    expect(r).toMatchSnapshot()
  })
})
