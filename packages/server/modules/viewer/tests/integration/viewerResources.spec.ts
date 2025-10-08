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
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { ViewerResourceGroup } from '@/modules/viewer/domain/types/resources'
import type { SavedView } from '@/modules/viewer/domain/types/savedViews'
import {
  getModelHomeSavedViewFactory,
  getSavedViewFactory
} from '@/modules/viewer/repositories/savedViews'
import {
  doViewerResourcesFit,
  getViewerResourceGroupsFactory,
  isResourceItemEqual,
  viewerResourcesToString
} from '@/modules/viewer/services/viewerResources'
import { createTestSavedView } from '@/modules/viewer/tests/helpers/savedViews'
import { itEach } from '@/test/assertionHelper'
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
        getSavedView: getSavedViewFactory({ db }),
        getModelHomeSavedView: getModelHomeSavedViewFactory({ db })
      })

    const resourceIdStringFromGroups = (groups: ViewerResourceGroup[]) =>
      groups.map((g) => g.identifier).join(',')

    const allVersions = (): BasicTestCommit[] => {
      return Object.values(myVersions).flat()
    }

    const getModelVersions = (modelId: string) => myVersions[modelId].slice() // slice to avoid mutating source

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
                type === 'specific' ? getModelVersions(m.id).at(-1)?.id : undefined
              )
          )
        )

        const { groups: result } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString().toString(),
          loadedVersionsOnly: type !== 'all'
        })

        expect(result.length).to.equal(myModels.length)
        for (const group of result) {
          const model = myModels.find((m) => group.identifier.startsWith(m.id))
          expect(model).to.be.ok

          const versions = getModelVersions(model!.id)
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
      const { groups: result } = await sut({
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

      const { groups: result } = await sut({
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

      const { groups: result } = await sut({
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
        const latestVersion = getModelVersions(model!.id)
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

      const { groups } = await sut({
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
        let firstModelHomeView: SavedView
        let secondModelBasicView: SavedView

        const homeViewModel = () => firstModel()
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
                  .addModel(firstModel().id, getModelVersions(firstModel().id)[0].id)
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
                  .addModel(secondModel().id, getModelVersions(secondModel().id)[0].id)
                  .toResourceIds(),
                isHomeView: false
              }
            })
          ])

          firstModelHomeView = views[0]
          secondModelBasicView = views[1]
        })

        it('should not throw if setting nonexistant view', async () => {
          const sut = buildSUT()

          // shouldnt throw so that deleting a view while its referred to in the URL doesn't
          // cause the entire app to break - just ignore the value then
          const res = await sut({
            projectId: myProject.id,
            resourceIdString: resourceBuilder()
              .addResources(firstModel().id)
              .toString(),
            savedViewId: 'aaa'
          })

          expect(res).to.be.ok
        })

        itEach(
          [
            { loadOriginal: false, conflictWithView: false },
            { loadOriginal: true, conflictWithView: false },
            { loadOriginal: false, conflictWithView: true },
            { loadOriginal: true, conflictWithView: true }
          ],
          ({ loadOriginal, conflictWithView }) =>
            `add saved view resources without changing other ones${
              conflictWithView ? ' and merging into conflicting ones' : ''
            } (loadOriginal=${loadOriginal})`,
          async ({ loadOriginal, conflictWithView }) => {
            const sut = buildSUT()

            const resources = resourceBuilder()
              // 1st model specific version - should be left as is
              .addModel(firstModel().id, getModelVersions(firstModel().id)[1].id)
            if (conflictWithView) {
              // 2nd model add conflicting one w/ view - same model, different version
              resources.addModel(
                secondModel().id,
                getModelVersions(secondModel().id).at(1)!.id // 2nd one
              )
            } else {
              // 2nd model should be added by the view
            }

            const resourceIdString = resources.toString()

            const {
              groups,
              savedView,
              resourceIdString: returnedResourceIdString
            } = await sut({
              projectId: myProject.id,
              resourceIdString,
              savedViewId: secondModelBasicView.id,
              loadedVersionsOnly: true,
              savedViewSettings: { loadOriginal },
              applyHomeView: true
            })

            const expectedFinalResourceIdString = resourceBuilder()
              .addModel(firstModel().id, getModelVersions(firstModel().id)[1].id)
              .addModel(
                secondModel().id,
                !loadOriginal && !conflictWithView
                  ? undefined
                  : getModelVersions(secondModel().id).at(
                      loadOriginal ? 0 : conflictWithView ? 1 : -1
                    )!.id
              )
              .toString()
            expect(returnedResourceIdString).to.equal(expectedFinalResourceIdString)

            expect(savedView?.id).to.equal(secondModelBasicView.id)
            expect(groups).to.have.length(2)

            const firstModelResource = resources
              .filter(isModelResource)
              .find((r) => r.modelId === firstModel().id)
            const firstModelGroup = groups.find(
              (g) => g.identifier === firstModelResource?.toString()
            )
            expect(firstModelGroup).to.be.ok
            expect(firstModelGroup!.items.length).to.equal(1)
            expect(firstModelGroup!.items[0].modelId).to.equal(firstModel().id)
            expect(firstModelGroup!.items[0].versionId).to.equal(
              getModelVersions(firstModel().id)[1].id
            )
            expect(firstModelGroup!.items[0].objectId).to.be.ok

            const secondModelGroup = groups.find((g) => {
              const groupId = resourceBuilder().addResources(g.identifier)
              const viewIds = resourceBuilder()
                .addResources(secondModelBasicView.resourceIds)
                .forEach((r) => {
                  if (!isModelResource(r)) return

                  r.versionId = loadOriginal
                    ? r.versionId
                    : conflictWithView
                    ? getModelVersions(secondModel().id).at(1)!.id // cause we specified this one
                    : undefined // cause we didn't specify anything in the arg resourceIdString for this model
                })

              return groupId.isEqualTo(viewIds)
            })
            expect(secondModelGroup).to.be.ok
            expect(secondModelGroup!.items.length).to.equal(1)
            expect(secondModelGroup!.items[0].modelId).to.equal(secondModel().id)
            expect(secondModelGroup!.items[0].versionId).to.equal(
              getModelVersions(secondModel().id).at(
                loadOriginal ? 0 : conflictWithView ? 1 : -1
              )!.id
            )
            expect(secondModelGroup!.items[0].objectId).to.be.ok
          }
        )

        it('load model home view', async () => {
          const sut = buildSUT()
          const resources = resourceBuilder().addModel(homeViewModel().id)

          const { groups, savedView } = await sut({
            projectId: myProject.id,
            resourceIdString: resources.toString(),
            savedViewId: undefined,
            loadedVersionsOnly: true,
            applyHomeView: true
          })

          expect(savedView?.id).to.equal(firstModelHomeView.id)
          expect(groups).to.have.length(1)

          const homeViewGroup = groups[0]
          expect(homeViewGroup).to.be.ok
          expect(homeViewGroup!.items.length).to.equal(1)
          expect(homeViewGroup!.items[0].modelId).to.equal(homeViewModel().id)

          // expect(homeViewGroup!.items[0].versionId).to.equal(
          //   getModelVersions(homeViewModel().id)[0].id
          // ) // version specified in view, not latest one
          expect(homeViewGroup!.items[0].versionId).to.equal(
            getModelVersions(homeViewModel().id).at(-1)!.id
          ) // we're doing latest version for now

          expect(homeViewGroup!.items[0].objectId).to.be.ok
        })

        it('dont load model home view, if !applyHomeView', async () => {
          const sut = buildSUT()
          const resources = resourceBuilder().addModel(homeViewModel().id)

          const { groups, savedView } = await sut({
            projectId: myProject.id,
            resourceIdString: resources.toString(),
            savedViewId: undefined,
            loadedVersionsOnly: true,
            applyHomeView: false
          })

          expect(savedView).to.not.be.ok
          expect(groups).to.have.length(1)

          const homeViewGroup = groups[0]
          expect(homeViewGroup).to.be.ok
          expect(homeViewGroup!.items.length).to.equal(1)
          expect(homeViewGroup!.items[0].modelId).to.equal(homeViewModel().id)
          expect(homeViewGroup!.items[0].versionId).to.equal(
            getModelVersions(homeViewModel().id).at(-1)!.id
          ) // default: latest one
          expect(homeViewGroup!.items[0].objectId).to.be.ok
        })

        it("doesn't load home view if savedViewId explicitly null instead", async () => {
          const sut = buildSUT()
          const resources = resourceBuilder().addModel(homeViewModel().id)

          const { groups, savedView } = await sut({
            projectId: myProject.id,
            resourceIdString: resources.toString(),
            savedViewId: null,
            loadedVersionsOnly: true,
            applyHomeView: true
          })

          expect(savedView).to.be.not.ok
          expect(groups).to.have.length(1)

          const homeViewGroup = groups[0]
          expect(homeViewGroup).to.be.ok
          expect(homeViewGroup!.items.length).to.equal(1)
          expect(homeViewGroup!.items[0].modelId).to.equal(homeViewModel().id)
          expect(homeViewGroup!.items[0].versionId).to.equal(
            getModelVersions(homeViewModel().id).at(-1)!.id
          ) // default: latest one
          expect(homeViewGroup!.items[0].objectId).to.be.ok
        })

        it('doesnt load model home view if specific version specified', async () => {
          const sut = buildSUT()
          const resources = resourceBuilder().addModel(
            homeViewModel().id,
            getModelVersions(homeViewModel().id)[1].id
          )

          const { groups, savedView } = await sut({
            projectId: myProject.id,
            resourceIdString: resources.toString(),
            savedViewId: undefined,
            loadedVersionsOnly: true,
            applyHomeView: true
          })

          expect(savedView).to.be.not.ok
          expect(groups).to.have.length(1)

          const homeViewGroup = groups[0]
          expect(homeViewGroup).to.be.ok
          expect(homeViewGroup!.items.length).to.equal(1)
          expect(homeViewGroup!.items[0].modelId).to.equal(homeViewModel().id)
          expect(homeViewGroup!.items[0].versionId).to.equal(
            getModelVersions(homeViewModel().id)[1].id
          ) // concrete version specified
          expect(homeViewGroup!.items[0].objectId).to.be.ok
        })

        it('loads model home view if specific version specified exactly matches view', async () => {
          const sut = buildSUT()
          const resources = resourceBuilder().addModel(
            homeViewModel().id,
            getModelVersions(homeViewModel().id)[0].id // same one we have in view
          )

          const { groups, savedView, request } = await sut({
            projectId: myProject.id,
            resourceIdString: resources.toString(),
            savedViewId: undefined,
            loadedVersionsOnly: true,
            applyHomeView: true
          })

          expect(request.savedViewId).to.not.be.ok
          expect(savedView?.id).to.equal(firstModelHomeView.id)
          expect(groups).to.have.length(1)

          const homeViewGroup = groups[0]
          expect(homeViewGroup).to.be.ok
          expect(homeViewGroup!.items.length).to.equal(1)
          expect(homeViewGroup!.items[0].modelId).to.equal(homeViewModel().id)
          expect(homeViewGroup!.items[0].versionId).to.equal(
            getModelVersions(homeViewModel().id)[0].id
          ) // version specified in view, not latest one
          expect(homeViewGroup!.items[0].objectId).to.be.ok
        })
      })
    }

    describe('with preload resources', () => {
      it('adds preload resources with isPreloadOnly=true for model resources', async () => {
        const sut = buildSUT()

        // Use first model as main resource, second model as preload
        const mainModel = myModels[0]
        const preloadModel = myModels[1]

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder().addModel(preloadModel.id)

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(2)

        // Main resource should have isPreloadOnly=false
        const mainGroup = groups.find((g) => g.identifier.includes(mainModel.id))
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false
        expect(mainGroup!.items).to.have.length(1)
        expect(mainGroup!.items[0].modelId).to.equal(mainModel.id)

        // Preload resource should have isPreloadOnly=true
        const preloadGroup = groups.find((g) => g.identifier.includes(preloadModel.id))
        expect(preloadGroup).to.be.ok
        expect(preloadGroup!.isPreloadOnly).to.be.true
        expect(preloadGroup!.items).to.have.length(1)
        expect(preloadGroup!.items[0].modelId).to.equal(preloadModel.id)
      })

      it('adds preload resources with isPreloadOnly=true for object resources', async () => {
        const sut = buildSUT()

        const mainVersion = getModelVersions(myModels[0].id)[0]
        const preloadVersion = getModelVersions(myModels[1].id)[0]

        const resourceIds = resourceBuilder().addObject(mainVersion.objectId)
        const preloadResourceIds = resourceBuilder().addObject(preloadVersion.objectId)

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString()
        })

        expect(groups).to.have.length(2)

        // Main resource should have isPreloadOnly=false
        const mainGroup = groups.find((g) => g.identifier === mainVersion.objectId)
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false
        expect(mainGroup!.items).to.have.length(1)
        expect(mainGroup!.items[0].objectId).to.equal(mainVersion.objectId)

        // Preload resource should have isPreloadOnly=true
        const preloadGroup = groups.find(
          (g) => g.identifier === preloadVersion.objectId
        )
        expect(preloadGroup).to.be.ok
        expect(preloadGroup!.isPreloadOnly).to.be.true
        expect(preloadGroup!.items).to.have.length(1)
        expect(preloadGroup!.items[0].objectId).to.equal(preloadVersion.objectId)
      })

      it('skips duplicate resources from preload when they exist in main resourceIdString', async () => {
        const sut = buildSUT()

        const model = myModels[0]
        const otherModel = myModels[1]

        const resourceIds = resourceBuilder().addModel(model.id)
        const preloadResourceIds = resourceBuilder()
          .addModel(model.id) // duplicate
          .addModel(otherModel.id) // unique

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(2)

        // The duplicate model should only appear once with isPreloadOnly=false
        const mainGroup = groups.find((g) => g.identifier.includes(model.id))
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false

        // The unique preload model should have isPreloadOnly=true
        const preloadGroup = groups.find((g) => g.identifier.includes(otherModel.id))
        expect(preloadGroup).to.be.ok
        expect(preloadGroup!.isPreloadOnly).to.be.true
      })

      it('handles mixed resource types in preload', async () => {
        const sut = buildSUT()

        const mainModel = myModels[0]
        const preloadModel = myModels[1]
        const preloadVersion = getModelVersions(myModels[2].id)[0]

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder()
          .addModel(preloadModel.id)
          .addObject(preloadVersion.objectId)

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(3)

        // Main model resource
        const mainGroup = groups.find((g) => g.identifier.includes(mainModel.id))
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false

        // Preload model resource
        const preloadModelGroup = groups.find((g) =>
          g.identifier.includes(preloadModel.id)
        )
        expect(preloadModelGroup).to.be.ok
        expect(preloadModelGroup!.isPreloadOnly).to.be.true

        // Preload object resource
        const preloadObjectGroup = groups.find(
          (g) => g.identifier === preloadVersion.objectId
        )
        expect(preloadObjectGroup).to.be.ok
        expect(preloadObjectGroup!.isPreloadOnly).to.be.true
        expect(preloadObjectGroup!.items[0].objectId).to.equal(preloadVersion.objectId)
      })

      it('works with all models resource in preload', async () => {
        const sut = buildSUT()

        const mainModel = myModels[0]

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder().addAllModels()

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        // Should have one group for main model + one for "all" preload
        expect(groups).to.have.length(2)

        // Main model should have isPreloadOnly=false
        const mainGroup = groups.find((g) => g.identifier.includes(mainModel.id))
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false

        // All models group should have isPreloadOnly=true
        const allGroup = groups.find((g) => g.identifier === 'all')
        expect(allGroup).to.be.ok
        expect(allGroup!.isPreloadOnly).to.be.true
        expect(allGroup!.items).to.have.length(myModels.length) // All models
      })

      it('handles empty preloadResourceIdString gracefully', async () => {
        const sut = buildSUT()

        const model = myModels[0]
        const resourceIds = resourceBuilder().addModel(model.id)

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: '',
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(1)
        const group = groups[0]
        expect(group.isPreloadOnly).to.be.false
        expect(group.identifier).to.include(model.id)
      })

      it('handles undefined preloadResourceIdString gracefully', async () => {
        const sut = buildSUT()

        const model = myModels[0]
        const resourceIds = resourceBuilder().addModel(model.id)

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: undefined,
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(1)
        const group = groups[0]
        expect(group.isPreloadOnly).to.be.false
        expect(group.identifier).to.include(model.id)
      })

      it('works with specific version IDs in preload resources', async () => {
        const sut = buildSUT()

        const mainModel = myModels[0]
        const preloadModel = myModels[1]
        const preloadVersion = getModelVersions(preloadModel.id)[1] // specific version

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder().addModel(
          preloadModel.id,
          preloadVersion.id
        )

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        expect(groups).to.have.length(2)

        // Preload group should contain the specific version
        const preloadGroup = groups.find((g) => g.identifier.includes(preloadModel.id))
        expect(preloadGroup).to.be.ok
        expect(preloadGroup!.isPreloadOnly).to.be.true
        expect(preloadGroup!.items).to.have.length(1)
        expect(preloadGroup!.items[0].versionId).to.equal(preloadVersion.id)
        expect(preloadGroup!.items[0].objectId).to.equal(preloadVersion.objectId)
      })

      it('handles complex duplicate scenarios with overlapping model/object references', async () => {
        const sut = buildSUT()

        const model = myModels[0]
        const version = getModelVersions(model.id)[0]

        // Main: model resource, Preload: same model + object from same model
        const resourceIds = resourceBuilder().addModel(model.id)
        const preloadResourceIds = resourceBuilder()
          .addModel(model.id) // duplicate with main
          .addObject(version.objectId) // object from same model

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        // Should have groups for: model (non-preload) + object (preload)
        expect(groups).to.have.length(2)

        // Model group should not be preload-only (came from main resourceIdString)
        const modelGroup = groups.find((g) => g.identifier.includes(model.id))
        expect(modelGroup).to.be.ok
        expect(modelGroup!.isPreloadOnly).to.be.false

        // Object group should be preload-only
        const objectGroup = groups.find((g) => g.identifier === version.objectId)
        expect(objectGroup).to.be.ok
        expect(objectGroup!.isPreloadOnly).to.be.true
        expect(objectGroup!.items[0].objectId).to.equal(version.objectId)
      })

      it('works with folder resources in preload', async () => {
        const sut = buildSUT()

        const mainModel = myModels[0]

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder().addModelFolder('Model')

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        // Should have main model + preload folder (which contains multiple models)
        expect(groups).to.have.length.greaterThan(1)

        // Main model should not be preload-only
        const mainGroup = groups.find((g) => g.identifier.includes(mainModel.id))
        expect(mainGroup).to.be.ok
        expect(mainGroup!.isPreloadOnly).to.be.false

        // Folder resource should be preload-only
        const folderGroup = groups.find((g) => g.identifier.includes('Model'))
        expect(folderGroup).to.be.ok
        expect(folderGroup!.isPreloadOnly).to.be.true
      })

      it('handles case where all preload resources are duplicates', async () => {
        const sut = buildSUT()

        const model1 = myModels[0]
        const model2 = myModels[1]

        const resourceIds = resourceBuilder().addModel(model1.id).addModel(model2.id)
        const preloadResourceIds = resourceBuilder()
          .addModel(model1.id) // duplicate
          .addModel(model2.id) // duplicate

        const { groups } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        // Should only have 2 groups (both main resources, no preload-only ones)
        expect(groups).to.have.length(2)

        // Both should be non-preload
        for (const group of groups) {
          expect(group.isPreloadOnly).to.be.false
        }
      })

      it('preserves isPreloadOnly flag through different loadedVersionsOnly settings', async () => {
        const sut = buildSUT()

        const mainModel = myModels[0]
        const preloadModel = myModels[1]

        const resourceIds = resourceBuilder().addModel(mainModel.id)
        const preloadResourceIds = resourceBuilder().addModel(preloadModel.id)

        // Test with loadedVersionsOnly=false
        const { groups: groupsAllVersions } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: false
        })

        expect(groupsAllVersions).to.have.length(2)

        const mainGroupAllVersions = groupsAllVersions.find((g) =>
          g.identifier.includes(mainModel.id)
        )
        const preloadGroupAllVersions = groupsAllVersions.find((g) =>
          g.identifier.includes(preloadModel.id)
        )

        expect(mainGroupAllVersions!.isPreloadOnly).to.be.false
        expect(preloadGroupAllVersions!.isPreloadOnly).to.be.true

        // Test with loadedVersionsOnly=true
        const { groups: groupsLoadedOnly } = await sut({
          projectId: myProject.id,
          resourceIdString: resourceIds.toString(),
          preloadResourceIdString: preloadResourceIds.toString(),
          loadedVersionsOnly: true
        })

        expect(groupsLoadedOnly).to.have.length(2)

        const mainGroupLoadedOnly = groupsLoadedOnly.find((g) =>
          g.identifier.includes(mainModel.id)
        )
        const preloadGroupLoadedOnly = groupsLoadedOnly.find((g) =>
          g.identifier.includes(preloadModel.id)
        )

        expect(mainGroupLoadedOnly!.isPreloadOnly).to.be.false
        expect(preloadGroupLoadedOnly!.isPreloadOnly).to.be.true
      })
    })
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
