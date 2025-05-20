import {
  GetWorkspacePlanProductId,
  SubscriptionDataInput
} from '@/modules/gatekeeper/domain/billing'
import { WorkspacePricingProducts } from '@/modules/gatekeeperCore/domain/billing'
import { LogicError } from '@/modules/shared/errors'

export const mutateSubscriptionDataWithNewValidSeatNumbers = ({
  seatCount,
  workspacePlan,
  getWorkspacePlanProductId,
  subscriptionData
}: {
  seatCount: number
  workspacePlan: WorkspacePricingProducts
  getWorkspacePlanProductId: GetWorkspacePlanProductId
  subscriptionData: SubscriptionDataInput
}): void => {
  const productId = getWorkspacePlanProductId({ workspacePlan })
  const product = subscriptionData.products.find(
    (product) => product.productId === productId
  )
  if (seatCount < 0) throw new LogicError('Invalid seat count, cannot be negative')

  if (seatCount === 0 && product === undefined) return
  if (seatCount === 0 && product !== undefined) {
    const prodIndex = subscriptionData.products.indexOf(product)
    subscriptionData.products.splice(prodIndex, 1)
  } else if (product !== undefined && product.quantity >= seatCount) {
    product.quantity = seatCount
  } else {
    throw new LogicError('Invalid subscription state')
  }
}
