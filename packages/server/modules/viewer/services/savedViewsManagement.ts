import { NotImplementedError } from '@/modules/shared/errors'
import { CreateSavedView } from '@/modules/viewer/domain/operations/savedViews'

export const createSavedViewFactory = (): CreateSavedView => async () => {
  // TODO: Implement the saved view creation logic
  throw new NotImplementedError()
}
