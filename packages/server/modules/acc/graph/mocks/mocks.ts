/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import type { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { faker } from '@faker-js/faker'
import { times } from 'lodash-es'

const { FF_ACC_INTEGRATION_ENABLED } = getFeatureFlags()

const mocks: SpeckleModuleMocksConfig = {
  resolvers: ({ store }) => ({
    Project: {
      accSyncItems: () => {
        const count = faker.number.int({ min: 1, max: 10 })

        return {
          cursor: null,
          totalCount: count,
          items: times(count, () => store.get('AccSyncItem'))
        } as any
      }
    },
    AccSyncItem: {
      project: () => store.get('Project') as any,
      model: () => store.get('Model') as any,
      author: () => store.get('LimitedUser') as any
    }
  }),
  mocks: {
    AccSyncItem: {
      status: () =>
        faker.helpers.arrayElement([
          'pending',
          'syncing',
          'failed',
          'succeeded',
          'paused'
        ]),
      accFileVersionIndex: () => faker.number.int({ min: 1, max: 999 }),
      accFileViewName: () =>
        faker.helpers.arrayElement([null, faker.lorem.slug({ min: 1, max: 6 })])
    }
  }
}

export default FF_ACC_INTEGRATION_ENABLED ? mocks : {}
