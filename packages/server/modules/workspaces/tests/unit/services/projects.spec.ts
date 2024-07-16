import { StreamRecord } from '@/modules/core/helpers/types'
import { queryAllWorkspaceProjectsFactory } from '@/modules/workspaces/services/projects'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

describe('Project retrieval services', () => {
  describe('queryAllWorkspaceProjectFactory returns a generator, that', () => {
    it('returns all streams for a workspace', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [{ workspaceId } as StreamRecord]

      const queryAllWorkspaceProjects = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return {
            streams: storedProjects,
            totalCount: storedProjects.length,
            cursorDate: null
          }
        }
      })

      for await (const project of queryAllWorkspaceProjects(workspaceId)) {
        foundProjects.push(project)
      }

      expect(foundProjects.length).to.equal(1)
    })
    it('returns all streams for a workspace if the query requires multiple pages of results', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []
      const storedProjects: StreamRecord[] = [
        { workspaceId } as StreamRecord,
        { workspaceId } as StreamRecord
      ]

      const queryAllWorkspaceProjects = queryAllWorkspaceProjectsFactory({
        getStreams: async ({ cursor }) => {
          return cursor
            ? { streams: [storedProjects[1]], totalCount: 1, cursorDate: null }
            : { streams: [storedProjects[0]], totalCount: 1, cursorDate: new Date() }
        }
      })

      for await (const project of queryAllWorkspaceProjects(workspaceId)) {
        foundProjects.push(project)
      }

      expect(foundProjects.length).to.equal(2)
    })
    it('exits if no results are found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const foundProjects: StreamRecord[] = []

      const queryAllWorkspaceProjects = queryAllWorkspaceProjectsFactory({
        getStreams: async () => {
          return { streams: [], totalCount: 0, cursorDate: null }
        }
      })

      for await (const project of queryAllWorkspaceProjects(workspaceId)) {
        foundProjects.push(project)
      }

      expect(foundProjects.length).to.equal(0)
    })
  })
})
