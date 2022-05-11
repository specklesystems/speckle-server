/* istanbul ignore file */
/* eslint-disable camelcase */
const expect = require('chai').expect
const assert = require('assert')

const { beforeEachContext } = require('@/test/hooks')
const { getAnIdForThisOnePlease } = require('@/test/helpers')

const { createUser } = require('../services/users')
const { createStream } = require('../services/streams')
const {
  createObject,
  createObjects,
  createObjectsBatched,
  getObject,
  getObjects,
  getObjectChildren,
  getObjectChildrenQuery,
  getObjectChildrenStream
} = require('../services/objects')

const sampleCommit = JSON.parse(`{
  "Objects": [
    {
      "speckleType": "reference",
      "referencedId": "8a9b0676b7fe3e5e487bb34549e67f67"
    }
  ],
  "Description": "draft commit",
  "Parents": [
    "beb6c53c4e531f4c259a59e943dd3043"
  ],
  "CreatedOn": "2020-03-18T12:06:07.82307Z",
  "id": "79eb41764cc2c065de752bd704bfc4aa",
  "speckleType": "Speckle.Core.Commit"
}`)

const sampleObject = JSON.parse(`{
  "Vertices": [],
  "id": "8a9b0676b7fe3e5e487bb34549e67f67",
  "applicationId": "test",
  "speckleType": "Tests.Polyline"
}`)

describe('Objects @core-objects', () => {
  const userOne = {
    name: 'Dimitrie Stefanescu',
    email: 'didimitrie43@gmail.com',
    password: 'sn3aky-1337-b1m'
  }

  const stream = {
    name: 'Test Streams',
    description: 'Whatever goes in here usually...'
  }

  before(async () => {
    await beforeEachContext()

    userOne.id = await createUser(userOne)
    stream.id = await createStream({ ...stream, isPublic: false, ownerId: userOne.id })
  })

  it('Should create objects', async () => {
    sampleObject.id = await createObject(stream.id, sampleObject)
    sampleCommit.id = await createObject(stream.id, sampleCommit)
  })

  const objCount_1 = 10
  const objCount_2 = 1000
  const objs = []
  const objs2 = []

  it(`Should create ${objCount_1} objects`, async () => {
    for (let i = 0; i < objCount_1; i++) {
      objs.push({
        amazingness: i * i,
        somethingness: `Sample ${i % 2 === 0 ? 'SUPER MEGA' : '1010101000010101'} ERRR`
      })
    }

    const ids = await createObjects(stream.id, objs)

    expect(ids).to.have.lengthOf(objCount_1)
  }).timeout(30000)

  it(`Should create ${objCount_2} objects`, async () => {
    for (let i = 0; i < objCount_2; i++) {
      objs2.push({
        amazingness: i * i,
        somethingness: `Sample HASH ${
          i % 2 === 0 ? 'SUPER MEGA HASH CHANGE' : '100101'
        } ERRR`,
        x: 10,
        y: i * 2,
        z: i * 0.23432,
        random: {
          blargh:
            'A a auctor arcu id enim felis, luctus sed sit lacus enim phasellus ultricies, quis fermentum, platea placerat vel integer. Enim urna natoque eros id volutpat voluptatum, vitae pede nec in nam. In libero nullam, habitasse auctor a laoreet justo. Vestibulum enim laoreet quis magna in. Non pharetra sit semper vitae ac fusce, non nisl molestie porttitor leo sed, quam vulputate, suscipit sed elit fringilla justo viverra, mattis dignissim ullamcorper a in. Pellentesque velit posuere ipsum, eu pharetra. Magna ac orci sit, malesuada lacinia mauris sed sunt ac neque. Mollis volutpat cras a, donec ac, etiam commodo id fringilla et tempor mi, pellentesque lacus ac morbi ultrices. Diam amet felis aliquam nibh nunc sed. Rhoncus malesuada in malesuada proin sed nam, viverra ante sollicitudin eu augue risus nisl, velit interdum vivamus dictumst. Phasellus fusce wisi non ipsum elit gravida. Nunc scelerisque, interdum adipiscing quam integer commodo, modi tempor sociis sociosqu dui nullam.A a auctor arcu id enim felis, luctus sed sit lacus enim phasellus ultricies, quis fermentum, platea placerat vel integer. Enim urna natoque eros id volutpat voluptatum, vitae pede nec in nam. In libero nullam, habitasse auctor a laoreet justo. Vestibulum enim laoreet quis magna in. Non pharetra sit semper vitae ac fusce, non nisl molestie porttitor leo sed, quam vulputate, suscipit sed elit fringilla justo viverra, mattis dignissim ullamcorper a in. Pellentesque velit posuere ipsum, eu pharetra. Magna ac orci sit, malesuada lacinia mauris sed sunt ac neque. Mollis volutpat cras a, donec ac, etiam commodo id fringilla et tempor mi, pellentesque lacus ac morbi ultrices. Diam amet felis aliquam nibh nunc sed. Rhoncus malesuada in malesuada proin sed nam, viverra ante sollicitudin eu augue risus nisl, velit interdum vivamus dictumst. Phasellus fusce wisi non ipsum elit gravida. Nunc scelerisque, interdum adipiscing quam integer commodo, modi tempor sociis sociosqu dui nullam.Lorem ipsum dolor sit amet, lorem scelerisque curabitur elementum eligendi, sed ut nibh. Nullam ac ut proin tortor tortor, ultrices odio litora eu, at lectus. Nulla et est, donec at, rutrum massa eros elit nisl sed, integer amet fusce tempus phasellus aliquam posuere, molestie adipiscing quas magnis convallis tellus. Exercitation purus aliquam, tortor pellentesque. Consequat arcu quis eros, turpis ultrices tempor elementum, platea cursus dignissim nulla. Ultrices vestibulum sit et taciti ut, nunc interdum. In eleifend amet sed a tortor, sed condimentum pede nam magna, nisl nam tristique pede ut at, eleifend sit ac vitae orci, nec wisi vestibulum tortor facilisis. Cras nunc debitis duis placerat curabitur, conubia vel ullamcorper vestibulum morbi donec, molestie rutrum.Cras elit ut, quis diam sed sollicitudin morbi rhoncus, ante velit, at ipsum debitis. Ut ipsum, et sed morbi odio libero viverra eget, nihil blandit nonummy mauris. Et sed nisl fermentum nunc sapien erat, dolor mattis pellentesque nec sapien faucibus, praesent lectus odio rhoncus id dolor, velit at lorem iaculis condimentum. Id suscipit amet nec rutrum, erat magnis amet id, lacus tristique. Neque id mauris dapibus consectetuer ut scelerisque, tincidunt fringilla quis dolores, praesent ipsum, nec tortor ultricies, posuere a fusce et magna.'
        },
        __tree: [
          '79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e67f6723',
          '79eb41764cc2c065de752bd704bfc4aa.8a9b0676b7fe3e5e487bb34549e623237f67' +
            i / 2.0,
          '79eb41764cc2c065de752bd704asdf4aa.' + i + '.' + i * i,
          '79eb41764cc2c065de752bd704bfc4aa.' + i + '.' + i * i + 3
        ]
      })
    }

    const myIds = await createObjects(stream.id, objs2)

    myIds.forEach((h, i) => (objs2[i].id = h))

    expect(myIds).to.have.lengthOf(objCount_2)
  }).timeout(30000)

  it('Should get a single object', async () => {
    const obj = await getObject({ streamId: stream.id, objectId: sampleCommit.id })
    expect(obj).to.not.be.null
  })

  it('Should get more objects', async () => {
    const myObjs = await getObjects(
      stream.id,
      objs.map((o) => o.id)
    )
    expect(myObjs).to.have.lengthOf(objs.length)

    const match1 = myObjs.find((o) => o.id === objs[0].id)
    expect(match1).to.not.be.null
    expect(match1.id).to.equal(objs[0].id)

    const match2 = myObjs.find((o) => o.id === objs[2].id)
    expect(match2).to.not.be.null
    expect(match2.id).to.equal(objs[2].id)
  })

  let parentObjectId

  it('Should get object children', async () => {
    const objs_1 = createManyObjects(100, 'noise__')
    const ids = await createObjects(stream.id, objs_1)
    // console.log( ids )
    // console.log(ids[ 0 ])

    // The below are just performance benchmarking.
    // let objs_2 = createManyObjects( 20000, 'noise_2' )
    // let ids2 = await createObjects( objs_2 )

    // let objs_3 = createManyObjects( 100000, 'noise_3' )
    // let ids3 = await createObjects( objs_3 )

    // let { rows } = await getObjectChildren( { objectId: ids[0], select: ['id', 'name', 'sortValueB'] } )
    // let { rows } = await getObjectChildren( { objectId: ids[ 0 ] } )

    const limit = 50
    const { objects: rows_1, cursor: cursor_1 } = await getObjectChildren({
      streamId: stream.id,
      limit,
      objectId: ids[0],
      select: [
        'nest.mallard',
        'test.value',
        'test.secondValue',
        'nest.arr[0]',
        'nest.arr[1]'
      ]
    })

    expect(rows_1.length).to.equal(limit)
    expect(rows_1[0]).to.be.an('object')
    expect(rows_1[0]).to.have.property('id')
    expect(rows_1[0]).to.have.nested.property('data.test.secondValue')
    expect(rows_1[0]).to.have.nested.property('data.nest.mallard')

    expect(cursor_1).to.be.a('string')

    const { objects: rows_2 } = await getObjectChildren({
      streamId: stream.id,
      limit,
      objectId: ids[0],
      select: [
        'nest.mallard',
        'test.value',
        'test.secondValue',
        'nest.arr[0]',
        'nest.arr[1]'
      ],
      cursor: cursor_1
    })

    expect(rows_2.length).to.equal(50)
    expect(rows_2[0]).to.be.an('object')
    expect(rows_2[0]).to.have.property('id')
    expect(rows_2[0]).to.have.nested.property('data.test.secondValue')
    expect(rows_2[0]).to.have.nested.property('data.nest.mallard')

    const { objects } = await getObjectChildren({
      streamId: stream.id,
      objectId: ids[0],
      limit: 1000
    })
    expect(objects.length).to.equal(100)

    parentObjectId = ids[0]
  }).timeout(30000)

  it('should query object children, ascending order', async () => {
    // we're assuming the prev test objects exist

    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      select: ['id', 'test.value'],
      limit: 3,
      query: [
        { field: 'test.value', operator: '>', value: 1 },
        { field: 'test.value', operator: '<', value: 24 },
        { verb: 'OR', field: 'test.value', operator: '=', value: 42 }
      ],
      orderBy: { field: 'test.value', direction: 'asc' }
    })

    const test2 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      select: ['id', 'test.value', 'nest.duck'],
      limit: 40,
      query: [
        { field: 'test.value', operator: '>', value: 1 },
        { field: 'test.value', operator: '<', value: 24 },
        { verb: 'OR', field: 'test.value', operator: '=', value: 42 }
      ],
      orderBy: { field: 'test.value', direction: 'asc' },
      cursor: test.cursor
    })

    // console.log( test.cursor )

    // console.log( test.objects.map( o => ( { v: o.data.test.value, id: o.id } ) ))
    // console.log( test2.objects.map( o =>  ( { v: o.data.test.value, id: o.id } )))
    // console.log( test2.objects)

    // limit
    expect(test.objects.length).to.equal(3)
    expect(test2.objects.length).to.equal(20)

    // cursors
    expect(test.cursor).to.be.a('string')
    expect(test2.cursor).to.equal(null)

    // total count should be correct (invariant) across all requests with same query
    expect(test.totalCount).to.equal(23)
    expect(test2.totalCount).to.equal(23)

    expect(test.objects[0].data.test.value).to.be.below(test.objects[1].data.test.value)
    expect(test2.objects[0].data.test.value).to.be.below(
      test2.objects[1].data.test.value
    )

    // continuity
    expect(test.objects[test.objects.length - 1].data.test.value + 1).to.equal(
      test2.objects[0].data.test.value
    )
  })

  it('should query object children desc on a field with duplicate values, without selecting fields', async () => {
    // Note: the `similar` field is incremented on i%3===0, resulting in a pattern of 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, etc.
    const test3 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      // select: [ 'similar', 'id' ],
      query: [
        { field: 'similar', operator: '>=', value: 0 },
        { field: 'similar', operator: '<', value: 100 }
      ],
      orderBy: { field: 'similar', direction: 'asc' },
      limit: 5
    })

    const test4 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      // select: [ 'similar', 'id' ],
      query: [
        { field: 'similar', operator: '>=', value: 0 },
        { field: 'similar', operator: '<', value: 100 }
      ],
      orderBy: { field: 'similar', direction: 'asc' },
      cursor: test3.cursor,
      limit: 5
    })

    // limit
    expect(test3.objects.length).to.equal(5)
    expect(test4.objects.length).to.equal(5)

    // cursors
    expect(test3.cursor).to.be.a('string')
    expect(test4.cursor).to.be.a('string')

    // total count should be correct (invariant) across all requests with same query
    expect(test3.totalCount).to.equal(100)
    expect(test4.totalCount).to.equal(100)

    expect(test3.objects[0].data.similar).to.be.below(test3.objects[1].data.similar) // 0, 1, 1, 1, ...
    expect(test4.objects[0].data.similar).to.be.below(test4.objects[3].data.similar)

    // continuity (in reverse)
    expect(test3.objects[test3.objects.length - 1].data.similar).to.equal(
      test3.objects[test3.objects.length - 2].data.similar + 1
    )
    expect(test3.objects[test3.objects.length - 1].data.similar).to.equal(
      test4.objects[0].data.similar
    )
    expect(test4.objects[1].data.similar).to.equal(test4.objects[2].data.similar - 1)
  })

  it('should query object children with no results ', async () => {
    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      query: [
        { field: 'test.value', operator: '>=', value: 10 },
        { field: 'test.value', operator: '<', value: 9 }
      ],
      orderBy: { field: 'test.value', direction: 'desc' }
    })

    expect(test.totalCount).to.equal(0)
    expect(test.cursor).to.be.null
  })

  it('should not allow invalid query operators ', async () => {
    try {
      await getObjectChildrenQuery({
        streamId: stream.id,
        objectId: parentObjectId,
        query: [
          {
            field: 'test.value',
            operator: '> 0; BOBBY DROPPPPED MY TABLES; -- and the bass?',
            value: 10
          },
          { field: 'test.value', operator: '<', value: 9 }
        ],
        orderBy: { field: 'test.value', direction: 'desc' }
      })
      assert.fail('sql injections are bad for health')
    } catch (err) {
      // pass
    }
  })

  it('should query children and sort them by a boolean value ', async () => {
    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 5,
      select: ['test.value', 'nest.duck'],
      query: [{ field: 'test.value', operator: '<', value: 10 }],
      orderBy: { field: 'nest.duck', direction: 'desc' }
    })

    const test2 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 5,
      select: ['test.value', 'nest.duck'],
      query: [{ field: 'test.value', operator: '<', value: 10 }],
      orderBy: { field: 'nest.duck', direction: 'desc' },
      cursor: test.cursor
    })

    expect(test.objects[0].data.nest.duck).to.equal(true)
    expect(test2.objects[test2.objects.length - 1].data.nest.duck).to.equal(false) // last duck should be false
  })

  it('should query children and sort them by a string value ', async () => {
    const limVal = 20

    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 5,
      query: [{ field: 'test.value', operator: '<', value: limVal }],
      orderBy: { field: 'name', direction: 'asc' }
    })

    const test2 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 5,
      query: [{ field: 'test.value', operator: '<', value: limVal }],
      orderBy: { field: 'name', direction: 'asc' },
      cursor: test.cursor
    })

    expect(test.objects.length).to.equal(5)
    expect(test.cursor).to.be.a('string')

    expect(test.objects[0].data.name).to.equal('mr. 0')
    expect(test.objects[1].data.name).to.equal('mr. 1')
    expect(test.objects[2].data.name).to.equal('mr. 10') // remember kids, this is a lexicographical sort
    expect(test.objects[4].data.name).to.equal('mr. 12')
    expect(test2.objects[0].data.name).to.equal('mr. 13')
  })

  it('should query children and sort them by id by default ', async () => {
    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 3,
      query: [
        { field: 'test.value', operator: '>=', value: 10 },
        { field: 'test.value', operator: '<', value: 100 }
      ]
    })

    expect(test.totalCount).to.equal(90)

    const test2 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 3,
      query: [
        { field: 'test.value', operator: '>=', value: 10 },
        { field: 'test.value', operator: '<', value: 100 }
      ],
      cursor: test.cursor
    })
    expect(test.objects[1].id < test.objects[2].id)
    expect(test.objects[2].id < test2.objects[0].id)
  })

  it('should just order results by something', async () => {
    const test = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 2,
      orderBy: { field: 'test.value', direction: 'desc' }
    })

    const test2 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 2,
      orderBy: { field: 'test.value', direction: 'desc' },
      cursor: test.cursor
    })

    expect(test.objects[1].data.test.value).to.equal(
      test2.objects[0].data.test.value + 1
    ) // continuity check

    const test3 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 50,
      orderBy: { field: 'nest.duck', direction: 'desc' }
    })

    const test4 = await getObjectChildrenQuery({
      streamId: stream.id,
      objectId: parentObjectId,
      limit: 50,
      orderBy: { field: 'nest.duck', direction: 'desc' },
      cursor: test3.cursor
    })

    expect(test3.objects[49].data.nest.duck).to.equal(true)
    expect(test4.objects[0].data.nest.duck).to.equal(false)
  })

  let commitId
  it('should batch create objects', async () => {
    const objs = createManyObjects(3333, 'perlin merlin magic')
    commitId = objs[0].id

    await createObjectsBatched(stream.id, objs)

    const parent = await getObject({ streamId: stream.id, objectId: commitId })
    expect(parent.totalChildrenCount).to.equal(3333)
    const commitChildren = await getObjectChildren({
      streamId: stream.id,
      objectId: commitId,
      limit: 2
    })
    expect(commitChildren.objects.length).to.equal(2)
  })

  it('should stream objects back', (done) => {
    let tcount = 0
    getObjectChildrenStream({ streamId: stream.id, objectId: commitId }).then(
      (stream) => {
        stream.on('data', () => tcount++)
        stream.on('end', () => {
          expect(tcount).to.equal(3333)
          done()
        })
      }
    )
  })

  it('should not deadlock when batch inserting in random order', async function () {
    this.timeout(5000)
    const objs = createManyObjects(5000, 'perlin merlin magic')

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
      }
    }

    const shuffledVersions = []
    for (let i = 0; i < 3; i++) {
      const shuffledVersion = objs.slice()
      shuffleArray(shuffledVersion)
      shuffledVersions.push(shuffledVersion)
    }

    const promisses = []
    for (let i = 0; i < shuffledVersions.length; i++) {
      const promise = createObjectsBatched(stream.id, shuffledVersions[i])
      promise.catch(() => {})
      promisses.push(promise)
    }

    for (let i = 0; i < promisses.length; i++) {
      await promisses[i]
    }
  })
})

function createManyObjects(num, noise) {
  num = num || 10000
  noise = noise || Math.random() * 100

  const objs = []

  const base = { name: 'base bastard 2', noise, __closure: {} }
  objs.push(base)
  let k = 0

  for (let i = 0; i < num; i++) {
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
    if (i > 1000) base.__closure[baby.id] = 2

    objs.push(baby)
  }

  getAnIdForThisOnePlease(base)
  return objs
}
