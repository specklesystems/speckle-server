import { GetAvailableRegionConfigs } from '@/modules/multiregion/domain/operations'

export const getAvailableRegionConfigsFactory =
  (): GetAvailableRegionConfigs => async () => {
    // TODO: Hardcoded for now, should be fetched from a config file
    return [
      {
        locale: 'eu',
        connectionUri: 'postgresql://speckle:speckle@localhost/speckle_eu'
      }
    ]
  }
