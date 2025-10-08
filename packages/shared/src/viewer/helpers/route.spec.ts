import { describe, expect, it } from 'vitest'
import {
  createGetParamFromResources,
  parseResourceFromString,
  parseUrlParameters,
  resourceBuilder
} from './route.js'

describe('Viewer Route Helpers', () => {
  describe('parseResourceFromString', () => {
    it('parses "all" as ViewerAllModelsResource', () => {
      const resource = parseResourceFromString('all')
      expect(resource.type).toBe('all-models')
      expect(resource.toString()).toBe('all')
    })

    it('parses modelId as ViewerModelResource', () => {
      const resource = parseResourceFromString('abc123')
      expect(resource.type).toBe('Model')
      expect(resource.toString()).toBe('abc123')
    })

    it('parses modelId@versionId as ViewerModelResource', () => {
      const resource = parseResourceFromString('abc123@ver456')
      expect(resource.type).toBe('Model')
      expect(resource.toString()).toBe('abc123@ver456')
    })

    it('parses $folderName as ViewerModelFolderResource', () => {
      const resource = parseResourceFromString('$myFolder')
      expect(resource.type).toBe('ModelFolder')
      expect(resource.toString()).toBe('$myFolder') // keep casing
    })

    it('parses 32-char string as ViewerObjectResource', () => {
      const objectId = '1234567890abcdef1234567890abcdef'
      const resource = parseResourceFromString(objectId)
      expect(resource.type).toBe('Object')
      expect(resource.toString()).toBe(objectId)
    })

    it('parses modelId with uppercase as ViewerModelResource and lowercases it', () => {
      const resource = parseResourceFromString('ABC123')
      expect(resource.type).toBe('Model')
      expect(resource.toString()).toBe('abc123')
    })

    it('parses $FOLDERNAME with uppercase as ViewerModelFolderResource and lowercases it', () => {
      const resource = parseResourceFromString('$FOLDERNAME')
      expect(resource.type).toBe('ModelFolder')
      expect(resource.toString()).toBe('$FOLDERNAME')
    })

    it('parses modelId@versionId with uppercase as ViewerModelResource and lowercases it', () => {
      const resource = parseResourceFromString('ABC123@VER456')
      expect(resource.type).toBe('Model')
      expect(resource.toString()).toBe('abc123@ver456')
    })
  })

  describe('parseUrlParameters', () => {
    it('returns empty array for empty string', () => {
      expect(parseUrlParameters('')).toEqual([])
    })

    it('parses single modelId', () => {
      const resources = parseUrlParameters('abc123')
      expect(resources).toHaveLength(1)
      expect(resources[0].type).toBe('Model')
      expect(resources[0].toString()).toBe('abc123')
    })

    it('parses multiple modelIds and sorts them', () => {
      const resources = parseUrlParameters('zxy,abc')
      expect(resources).toHaveLength(2)
      expect(resources[0].toString()).toBe('abc')
      expect(resources[1].toString()).toBe('zxy')
    })

    it('parses modelId@versionId and $folder', () => {
      const resources = parseUrlParameters('abc@ver,$folder')
      expect(resources).toHaveLength(2)
      expect(resources.some((r) => r.type === 'Model')).toBe(true)
      expect(resources.some((r) => r.type === 'ModelFolder')).toBe(true)
    })

    it('removes duplicate resources', () => {
      const resources = parseUrlParameters('abc,abc,ABC')
      expect(resources).toHaveLength(1)
      expect(resources[0].toString()).toBe('abc')
    })

    it('handles all resource types together', () => {
      const objectId = '1234567890abcdef1234567890abcdef'
      const resources = parseUrlParameters(`all,abc@ver,$folder,${objectId}`)
      expect(resources).toHaveLength(4)
      expect(resources.some((r) => r.type === 'all-models')).toBe(true)
      expect(resources.some((r) => r.type === 'Model')).toBe(true)
      expect(resources.some((r) => r.type === 'ModelFolder')).toBe(true)
      expect(resources.some((r) => r.type === 'Object')).toBe(true)
    })

    it('handles whitespace and ignores empty parts', () => {
      const resources = parseUrlParameters('abc, , ,def')
      expect(resources).toHaveLength(2)
      expect(resources[0].toString()).toBe('abc')
      expect(resources[1].toString()).toBe('def')
    })

    it('lowercases all resource strings', () => {
      const resources = parseUrlParameters('ABC,$FOLDER,DEF@VER')
      expect(resources.map((r) => r.toString()).sort()).toEqual(
        ['$FOLDER', 'abc', 'def@ver'].sort()
      )
    })

    it('sorts resources alphabetically by toString', () => {
      const resources = parseUrlParameters('z,abc,def')
      expect(resources.map((r) => r.toString())).toEqual(['abc', 'def', 'z'])
    })
  })

  describe('createGetParamFromResources', () => {
    it('returns empty string for empty resource array', () => {
      expect(createGetParamFromResources([])).toBe('')
    })

    it('returns single resource string for one resource', () => {
      const resources = [parseResourceFromString('abc123')]
      expect(createGetParamFromResources(resources)).toBe('abc123')
    })

    it('returns comma-separated, sorted, lowercased resource strings', () => {
      const resources = [
        parseResourceFromString('ZXY'),
        parseResourceFromString('abc'),
        parseResourceFromString('DEF@VER')
      ]
      expect(createGetParamFromResources(resources)).toBe('abc,def@ver,zxy')
    })

    it('removes duplicate resources (case-insensitive)', () => {
      const resources = [
        parseResourceFromString('abc'),
        parseResourceFromString('ABC'),
        parseResourceFromString('Abc')
      ]
      expect(createGetParamFromResources(resources)).toBe('abc')
    })

    it('handles all resource types and sorts them', () => {
      const objectId = '1234567890abcdef1234567890abcdef'
      const resources = [
        parseResourceFromString('all'),
        parseResourceFromString('abc@ver'),
        parseResourceFromString('$folder'),
        parseResourceFromString(objectId)
      ]
      expect(createGetParamFromResources(resources)).toBe(
        `$folder,1234567890abcdef1234567890abcdef,abc@ver,all`
          .split(',')
          .sort()
          .join(',')
      )
    })

    it('handles resources with mixed case and sorts them', () => {
      const resources = [
        parseResourceFromString('DEF@VER'),
        parseResourceFromString('abc'),
        parseResourceFromString('ZXY')
      ]
      expect(createGetParamFromResources(resources)).toBe('abc,def@ver,zxy')
    })

    it('handles resources with $ in folder names', () => {
      const resources = [
        parseResourceFromString('$FolderA'),
        parseResourceFromString('$folderb')
      ]
      expect(createGetParamFromResources(resources)).toBe('$FolderA,$folderb')
    })
  })

  describe('resourceBuilder', () => {
    it('can add a single model', () => {
      const builder = resourceBuilder().addModel('abc123')
      expect(builder.length).toBe(1)
      expect(builder.toResources()[0].type).toBe('Model')
      expect(builder.toString()).toBe('abc123')
    })

    it('can add a model with version', () => {
      const builder = resourceBuilder().addModel('abc123', 'ver456')
      expect(builder.length).toBe(1)
      expect(builder.toResources()[0].toString()).toBe('abc123@ver456')
    })

    it('can add all models', () => {
      const builder = resourceBuilder().addAllModels()
      expect(builder.length).toBe(1)
      expect(builder.toResources()[0].type).toBe('all-models')
      expect(builder.toString()).toBe('all')
    })

    it('can add a model folder', () => {
      const builder = resourceBuilder().addModelFolder('MyFolder')
      expect(builder.length).toBe(1)
      expect(builder.toResources()[0].type).toBe('ModelFolder')
      expect(builder.toString()).toBe('$MyFolder')
    })

    it('can add an object', () => {
      const objectId = '1234567890abcdef1234567890abcdef'
      const builder = resourceBuilder().addObject(objectId)
      expect(builder.length).toBe(1)
      expect(builder.toResources()[0].type).toBe('Object')
      expect(builder.toString()).toBe(objectId)
    })

    it('can add from string with multiple resources', () => {
      const builder = resourceBuilder().addFromString('abc,def@ver,$folder')
      expect(builder.length).toBe(3)
      expect(builder.toString().split(',').sort()).toEqual(
        ['abc', 'def@ver', '$folder'].sort()
      )
    })

    it('can clear versionIds', () => {
      const builder = resourceBuilder().addResources('abc,def@ver')
      expect(builder.length).toBe(2)
      expect(builder.toString()).toBe('abc,def@ver')

      builder.clearVersions()
      expect(builder.length).toBe(2)
      expect(builder.toString()).toBe('abc,def')
    })

    it('can add resources array', () => {
      const resources = [
        parseResourceFromString('abc'),
        parseResourceFromString('def@ver')
      ]
      const builder = resourceBuilder().addResources(resources)
      expect(builder.length).toBe(2)
      expect(builder.toString().split(',').sort()).toEqual(['abc', 'def@ver'].sort())
    })

    it('can clear resources', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      expect(builder.length).toBe(2)
      builder.clear()
      expect(builder.length).toBe(0)
      expect(builder.toString()).toBe('')
    })

    it('can clone builder', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const clone = builder.clone()
      expect(clone).not.toBe(builder)
      expect(clone.toString()).toBe(builder.toString())
      clone.addModel('xyz')
      expect(clone.length).toBe(3)
      expect(builder.length).toBe(2)
    })

    it('can iterate over resources', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const ids = []
      for (const r of builder) {
        ids.push(r.toString())
      }
      expect(ids.sort()).toEqual(['abc', 'def'].sort())
    })

    it('can use forEach', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const ids: string[] = []
      builder.forEach((r) => ids.push(r.toString()))
      expect(ids.sort()).toEqual(['abc', 'def'].sort())
    })

    it('can use filter', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const res = builder.filter((r) => r.toString() === 'abc')
      expect(res.length).toBe(1)
      expect(res[0].toString()).toBe('abc')
    })

    it('can use map', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const types = builder.map((r) => r.type)
      expect(types.sort()).toEqual(['Model', 'Model'].sort())
    })

    it('toResources returns a copy', () => {
      const builder = resourceBuilder().addModel('abc')
      const arr = builder.toResources()
      expect(arr).toHaveLength(1)
      arr.push(parseResourceFromString('def'))
      expect(builder.length).toBe(1)
    })

    it('can find an item', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      const found = builder.find((r) => r.toString() === 'def')
      expect(found).toBeDefined()
      expect(found?.toString()).toBe('def')
    })

    it('addNew only adds new resources', () => {
      const builder = resourceBuilder().addModel('abc').addModel('def')
      builder.addNew('abc') // should not add
      expect(builder.length).toBe(2)
      builder.addNew('abc@yaya') // should not add
      expect(builder.length).toBe(2)
      builder.addNew('xyz') // should add
      expect(builder.length).toBe(3)
      builder.addNew('$newFolder') // should add
      expect(builder.length).toBe(4)
      expect(builder.toString()).toBe('$newFolder,abc,def,xyz') // $newFolder should keep casing
    })

    it('addResources can add any kind of ViewerResources', () => {
      const resources = [
        'abc',
        ['def@ver', '$folder'],
        parseResourceFromString('abc2'),
        parseResourceFromString('def2@ver'),
        parseResourceFromString('$2folder'),
        resourceBuilder().addModel('nestedModel')
      ]

      const builder = resourceBuilder()
      for (const res of resources) {
        builder.addResources(res)
      }

      expect(builder.length).toBe(7)
      expect(builder.toString().split(',').sort()).toEqual(
        [
          'abc',
          'abc2',
          'def@ver',
          'def2@ver',
          'nestedmodel',
          '$2folder',
          '$folder'
        ].sort()
      )
    })
  })
})
