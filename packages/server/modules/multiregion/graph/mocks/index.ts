import { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { faker } from '@faker-js/faker'

export default {
  mocks: {
    ServerRegionItem: () => {
      const key = faker.string.uuid()
      return {
        id: key,
        key,
        name: faker.address.country(),
        description: faker.lorem.sentence()
      }
    }
  }
} as SpeckleModuleMocksConfig
