import { GetAvailableRegionConfigs } from '@/modules/multiregion/domain/operations'

export const getAvailableRegionConfigsFactory =
  (): GetAvailableRegionConfigs => async () => {
    // TODO: Hardcoded for now, should be fetched from a config file
    return {
      eu: {
        postgres: {
          connectionUri: 'postgresql://speckle:speckle@localhost/speckle_eu',
          publicTlsCertificate: undefined
        }
      }
    }
  }
