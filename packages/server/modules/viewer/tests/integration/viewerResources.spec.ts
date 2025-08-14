import { db } from '@/db/knex'
import {
  getBranchesByIdsFactory,
  getBranchLatestCommitsFactory,
  getStreamBranchesByNameFactory
} from '@/modules/core/repositories/branches'
import {
  getAllBranchCommitsFactory,
  getSpecificBranchCommitsFactory
} from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import { buildBasicTestProject } from '@/modules/core/tests/helpers/creation'
import { NotFoundError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { ViewerResourceGroup } from '@/modules/viewer/domain/types/resources'
import type { SavedView } from '@/modules/viewer/domain/types/savedViews'
import { getSavedViewFactory } from '@/modules/viewer/repositories/savedViews'
import {
  doViewerResourcesFit,
  getViewerResourceGroupsFactory,
  isResourceItemEqual,
  viewerResourcesToString
} from '@/modules/viewer/services/viewerResources'
import { createTestSavedView } from '@/modules/viewer/tests/helpers/savedViews'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { buildBasicTestUser, createTestUser } from '@/test/authHelper'
import {
  createTestBranch,
  type BasicTestBranch
} from '@/test/speckle-helpers/branchHelper'
import type { BasicTestCommit } from '@/test/speckle-helpers/commitHelper'
import { createTestCommit } from '@/test/speckle-helpers/commitHelper'
import type { BasicTestStream } from '@/test/speckle-helpers/streamHelper'
import { createTestStream } from '@/test/speckle-helpers/streamHelper'
import { wait } from '@speckle/shared'
import {
  isModelResource,
  resourceBuilder,
  ViewerAllModelsResource,
  ViewerModelResource,
  ViewerObjectResource
} from '@speckle/shared/viewer/route'
import { expect } from 'chai'
import { times } from 'lodash-es'

describe('Viewer Resources Collection Service', () => {
  describe('getViewerResourceGroupsFactory', () => {
    let me: BasicTestUser
    let myProject: BasicTestStream
    let myModels: BasicTestBranch[]
    let myVersions: {
      /**
       * Versions are sorted by date asc - latest version is the last one
       */
      [modelId: string]: BasicTestCommit[]
    }

    const buildSUT = () =>
      getViewerResourceGroupsFactory({
        getStreamObjects: getStreamObjectsFactory({ db }),
        getBranchLatestCommits: getBranchLatestCommitsFactory({ db }),
        getStreamBranchesByName: getStreamBranchesByNameFactory({ db }),
        getSpecificBranchCommits: getSpecificBranchCommitsFactory({ db }),
        getAllBranchCommits: getAllBranchCommitsFactory({ db }),
        getBranchesByIds: getBranchesByIdsFactory({ db }),
        getSavedView: getSavedViewFactory({ db })
      })

    const resourceIdStringFromGroups = (groups: ViewerResourceGroup[]) =>
      groups.map((g) => g.identifier).join(',')

    const allVersions = (): BasicTestCommit[] => {
      return Object.values(myVersions).flat()
    }

    before(async () => {
      me = await createTestUser(buildBasicTestUser())
      myProject = await createTestStream(buildBasicTestProject(), me)

      // Add 3 models
      myModels = await Promise.all(
        times(3, (i) =>
          createTestBranch({
            branch: {
              name: `Model ${i + 1}`,
              description: `Description for model ${i + 1}`,
              streamId: myProject.id,
              authorId: me.id,
              id: ''
            },
            stream: myProject,
            owner: me
          })
        )
      )

      myVersions = {}
      await Promise.all(
        myModels.map(async (model) => {
          const versions: BasicTestCommit[] = []

          // Create versions serially so that we can easily resolve latest/default version
          for (let i = 0; i < 3; i++) {
            await wait(10)
            versions.push(
              await createTestCommit({
                streamId: myProject.id,
                authorId: me.id,
                message: `Version ${i + 1} for model ${model.name}`,
                createdAt: new Date(),
                id: '',
                objectId: '',
                branchId: model.id
              })
            )
          }

          myVersions[model.id] = versions
        })
      )
    })

    itEach(
      ['all', 'specific', 'latest'],
      (type) => `successfully resolves model groups (gets ${type} versions for each)`,
      async (type) => {
        const sut = buildSUT()
        const resourceIds = resourceBuilder().addResources(
          myModels.map(
            (m) =>
              new ViewerModelResource(
                m.id,
                type === 'specific' ? myVersions[m.id].at(-1)?.id : undefined
              )
          )
        )

        const result = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString().toString(),
          loadedVersionsOnly: type !== 'all'
        })

        expect(result.length).to.equal(myModels.length)
        for (const group of result) {
          const model = myModels.find((m) => group.identifier.startsWith(m.id))
          expect(model).to.be.ok

          const versions = myVersions[model!.id]
          expect(group.items).to.have.length(type === 'all' ? 3 : 1)

          if (type === 'all') {
            for (const item of group.items) {
              const version = versions.find((v) => v.id === item.versionId)
              expect(version).to.exist
              expect(item.modelId).to.include(model!.id)
              expect(item.objectId).to.equal(version?.objectId)
            }
          } else {
            let versionToCompareTo: BasicTestCommit
            if (type === 'specific') {
              const latestVersion = versions.at(-1) // we targeted the last one
              expect(latestVersion).to.be.ok
              versionToCompareTo = latestVersion!
            } else {
              const latestVersion = versions
                .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
                .at(0)
              expect(latestVersion).to.be.ok
              versionToCompareTo = latestVersion!
            }

            expect(group.items.length).to.equal(1) // one item per version
            const item = group.items[0]

            expect(item.modelId).to.equal(model!.id)
            expect(item.objectId).to.equal(versionToCompareTo.objectId)
            expect(item.versionId).to.equal(versionToCompareTo.id)
          }
        }
      }
    )

    it('return empty array on empty resourceIdString', async () => {
      const sut = buildSUT()
      const result = await sut({
        projectId: myProject.id,
        resourceIdString: ''
      })

      expect(result).to.have.length(0)
    })

    it('successfully returns objectId based groups', async () => {
      const sut = buildSUT()
      const versions = allVersions()
      const resourceIds = resourceBuilder().addResources(
        versions.map((v) => new ViewerObjectResource(v.objectId))
      )

      const result = await sut({
        projectId: myProject.id,
        resourceIdString: resourceIds.toString()
      })

      expect(result.length).to.equal(versions.length)
      for (const group of result) {
        const version = versions.find((v) => v.objectId === group.identifier)
        expect(version).to.be.ok
        expect(group.identifier).to.equal(version!.objectId)
        expect(group.items.length).to.equal(1) // one item per version

        const item = group.items[0]
        expect(item.objectId).to.equal(version!.objectId)
        expect(item.versionId).to.not.be.ok
        expect(item.modelId).to.not.be.ok
      }
    })

    it('successfully resolves all group (each models latest version)', async () => {
      const sut = buildSUT()
      const resourceIds = resourceBuilder().addResources([
        new ViewerAllModelsResource()
      ])

      const result = await sut({
        projectId: myProject.id,
        resourceIdString: resourceIds.toString()
      })

      expect(result.length).to.equal(1)
      const group = result[0]
      expect(group.identifier).to.equal('all')
      expect(group.items.length).to.equal(myModels.length)

      for (const item of group.items) {
        const model = myModels.find((m) => m.id === item.modelId)
        expect(model).to.be.ok
        expect(item.modelId).to.equal(model!.id)

        // Sort versions by createdAt, descending
        const latestVersion = myVersions[model!.id]
          .slice()
          .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
          .at(0)

        expect(latestVersion).to.be.ok
        expect(item.objectId).to.equal(latestVersion!.objectId)
        expect(item.versionId).to.equal(latestVersion!.id)
      }
    })

    it('successfully de-duplicates resources and provides them in the correct order', async () => {
      const sut = buildSUT()

      const groupCount = 2
      const wrongOrderModelIds = myModels
        .slice(0, groupCount)
        .map((m) => m.id)
        .sort((a, b) => {
          // Sort in wrong order - alphabetical descending
          return b.localeCompare(a)
        })
      const resourceIdString = [...wrongOrderModelIds, ...wrongOrderModelIds].join(',')

      const groups = await sut({
        projectId: myProject.id,
        resourceIdString
      })

      expect(groups).to.have.length(2)

      // group ids combined should make up a valid (properly ordered & de-duplicated) resource id string
      const combinedIdentifierString = resourceIdStringFromGroups(groups)
      const expectedResources = resourceBuilder().addResources(resourceIdString) // de-duplicates and re-orders

      expect(combinedIdentifierString).to.equal(expectedResources.toString())
    })

    if (getFeatureFlags().FF_SAVED_VIEWS_ENABLED) {
      describe('w/ saved views', () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let firstModelHomeView: SavedView

        let secondModelBasicView: SavedView

        const firstModel = () => myModels[0]
        const secondModel = () => myModels[1]

        before(async () => {
          const views = await Promise.all([
            createTestSavedView({
              author: me,
              project: myProject,
              view: {
                resourceIds: resourceBuilder()
                  // First model and first version (not default which would be latest version)
                  .addModel(firstModel().id, myVersions[firstModel().id][0].id)
                  .toResourceIds(),
                isHomeView: true
              }
            }),
            createTestSavedView({
              author: me,
              project: myProject,
              view: {
                resourceIds: resourceBuilder()
                  // Second model and first version (not default which would be latest version)
                  .addModel(secondModel().id, myVersions[secondModel().id][0].id)
                  .toResourceIds(),
                isHomeView: false
              }
            })
          ])

          firstModelHomeView = views[0]
          secondModelBasicView = views[1]
        })

        it('throws if setting nonexistant view', async () => {
          const sut = buildSUT()

          const err = await expectToThrow(
            async () =>
              await sut({
                projectId: myProject.id,
                resourceIdString: resourceBuilder()
                  .addResources(firstModel().id)
                  .toString(),
                savedViewId: 'aaa'
              })
          )
          expect(err instanceof NotFoundError).to.be.true
          expect(err.message).to.include('Saved view')
        })

        itEach(
          [{ loadOriginal: false }, { loadOriginal: true }],
          ({ loadOriginal }) =>
            `add saved view resources without changing other ones (loadOriginal=${loadOriginal})`,
          async ({ loadOriginal }) => {
            const sut = buildSUT()

            const firstModelIdString = resourceBuilder()
              // 1st model specific version - should be left as is
              // 2nd model should be added by the view
              .addModel(firstModel().id, myVersions[firstModel().id][0].id)
              .toString()

            const groups = await sut({
              projectId: myProject.id,
              resourceIdString: firstModelIdString,
              savedViewId: secondModelBasicView.id,
              loadedVersionsOnly: true,
              savedViewSettings: { loadOriginal }
            })

            expect(groups).to.have.length(2)
            const firstModelGroup = groups.find(
              (g) => g.identifier === firstModelIdString
            )
            expect(firstModelGroup).to.be.ok
            expect(firstModelGroup!.items.length).to.equal(1)
            expect(firstModelGroup!.items[0].modelId).to.equal(firstModel().id)
            expect(firstModelGroup!.items[0].versionId).to.equal(
              myVersions[firstModel().id][0].id
            )
            expect(firstModelGroup!.items[0].objectId).to.be.ok

            const secondModelGroup = groups.find((g) => {
              const groupId = resourceBuilder().addResources(g.identifier)
              const viewIds = resourceBuilder()
                .addResources(secondModelBasicView.resourceIds)
                .forEach((r) => {
                  if (!isModelResource(r)) return

                  r.versionId = loadOriginal ? r.versionId : undefined // cause we didn't specify anything in the arg resourceIdString for this model
                })

              return groupId.isEqualTo(viewIds)
            })
            expect(secondModelGroup).to.be.ok
            expect(secondModelGroup!.items.length).to.equal(1)
            expect(secondModelGroup!.items[0].modelId).to.equal(secondModel().id)
            expect(secondModelGroup!.items[0].versionId).to.equal(
              myVersions[secondModel().id].at(loadOriginal ? 0 : -1)!.id
            )
            expect(secondModelGroup!.items[0].objectId).to.be.ok
          }
        )
      })
    }
  })

  describe('isResourceItemEqual', () => {
    it('returns true for identical ViewerResourceItems', () => {
      const itemA = { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }
      const itemB = { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }
      expect(isResourceItemEqual(itemA, itemB)).to.be.true
    })

    it('returns false if modelId differs', () => {
      const itemA = { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }
      const itemB = { modelId: 'model2', objectId: 'obj1', versionId: 'ver1' }
      expect(isResourceItemEqual(itemA, itemB)).to.be.false
    })

    it('returns false if objectId differs', () => {
      const itemA = { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }
      const itemB = { modelId: 'model1', objectId: 'obj2', versionId: 'ver1' }
      expect(isResourceItemEqual(itemA, itemB)).to.be.false
    })

    it('returns false if versionId differs', () => {
      const itemA = { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }
      const itemB = { modelId: 'model1', objectId: 'obj1', versionId: 'ver2' }
      expect(isResourceItemEqual(itemA, itemB)).to.be.false
    })
  })

  describe('doViewerResourcesFit', () => {
    it('returns true if any incoming resource matches any requested resource', () => {
      const requested = [
        { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' },
        { modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }
      ]
      const incoming = [
        { modelId: 'model3', objectId: 'obj3', versionId: 'ver3' },
        { modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }
      ]
      expect(doViewerResourcesFit(requested, incoming)).to.be.true
    })

    it('returns false if no incoming resource matches any requested resource', () => {
      const requested = [{ modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }]
      const incoming = [{ modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }]
      expect(doViewerResourcesFit(requested, incoming)).to.be.false
    })

    it('returns false if both arrays are empty', () => {
      expect(doViewerResourcesFit([], [])).to.be.false
    })

    it('returns false if incomingResources is empty', () => {
      const requested = [{ modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }]
      expect(doViewerResourcesFit(requested, [])).to.be.false
    })

    it('returns false if requestedResources is empty', () => {
      const incoming = [{ modelId: 'model1', objectId: 'obj1', versionId: 'ver1' }]
      expect(doViewerResourcesFit([], incoming)).to.be.false
    })

    it('returns true if multiple matches exist', () => {
      const requested = [
        { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' },
        { modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }
      ]
      const incoming = [
        { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' },
        { modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }
      ]
      expect(doViewerResourcesFit(requested, incoming)).to.be.true
    })
  })

  describe('viewerResourcesToString', () => {
    it('returns correct string for model resources with modelId and versionId', () => {
      const resources = [
        { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' },
        { modelId: 'model2', objectId: 'obj2', versionId: 'ver2' }
      ]
      // The builder should call addModel for each
      const str = viewerResourcesToString(resources)

      // Should contain both modelId/versionId pairs, and not just objectIds
      expect(str).to.include('model1')
      expect(str).to.include('ver1')
      expect(str).to.include('model2')
      expect(str).to.include('ver2')
    })

    it('returns correct string for object resources with only objectId', () => {
      const resources = [
        { modelId: null, objectId: 'obj1', versionId: null },
        { modelId: undefined, objectId: 'obj2', versionId: undefined }
      ]
      const str = viewerResourcesToString(resources)
      expect(str).to.include('obj1')
      expect(str).to.include('obj2')

      // Should not contain "model" or "ver"
      expect(str).to.not.include('model')
      expect(str).to.not.include('ver')
    })

    it('returns correct string for mixed model and object resources', () => {
      const resources = [
        { modelId: 'model1', objectId: 'obj1', versionId: 'ver1' },
        { modelId: null, objectId: 'obj2', versionId: null }
      ]
      const str = viewerResourcesToString(resources)
      expect(str).to.include('model1')
      expect(str).to.include('ver1')
      expect(str).to.include('obj2')
    })

    it('returns empty string for empty resources array', () => {
      const str = viewerResourcesToString([])
      expect(str).to.equal('')
    })
  })
})
