import {
  Results,
  CurrentVersionResults
} from '@/modules/automations/helpers/inputTypes'

export const formatResults = (results: Results): CurrentVersionResults => {
  // TODO: As new versions are introduced, make sure this function is updated
  // and able to convert all of them to `CurrentVersionResults`
  return results
}
