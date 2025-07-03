/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { SpeckleModuleMocksConfig } from '@/modules/shared/helpers/mocks'
import { faker } from '@faker-js/faker'

// TODO: Some of these might make better sense in the base config, adjust as needed
const mocks: SpeckleModuleMocksConfig = {
  resolvers: ({ store }) => ({
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
      fileSize: () => faker.number.int({ min: 1, max: 1000 })
    }),
    Model: () => ({
      id: () => faker.string.uuid(),
      name: () => faker.commerce.productName(),
      previewUrl: () => faker.image.imageUrl()
    }),
    Version: () => ({
      id: () => faker.string.alphanumeric(10)
    })
  }
}
export default mocks
