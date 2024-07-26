/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { LimitedUser } from '@/modules/core/graph/generated/graphql'
import { SpeckleModuleMocksConfig } from '@/modules/mocks'
import { faker } from '@faker-js/faker'
import { Roles } from '@speckle/shared'

// TODO: Some of these might make better sense in the base config, adjust as needed
const mocks: SpeckleModuleMocksConfig = {
  resolvers: (store) => ({
    Project: {
      blob: () => {
        return store.get('BlobMetadata') as any
      }
    }
  }),
  mocks: {
    BlobMetadata: () => ({
      fileName: () => faker.system.fileName(),
      fileType: () => faker.system.mimeType(),
      fileSize: () => faker.datatype.number({ min: 1, max: 1000 })
    }),
    LimitedUser: () =>
      ({
        id: faker.datatype.uuid(),
        name: faker.name.findName(),
        avatar: faker.image.avatar(),
        bio: faker.lorem.sentence(),
        company: faker.company.companyName(),
        verified: faker.datatype.boolean(),
        role: Roles.Server.User
      } as LimitedUser),

    Model: () => ({
      id: () => faker.datatype.uuid(),
      name: () => faker.commerce.productName(),
      previewUrl: () => faker.image.imageUrl()
    }),
    Version: () => ({
      id: () => faker.random.alphaNumeric(10)
    })
  }
}
export default mocks
