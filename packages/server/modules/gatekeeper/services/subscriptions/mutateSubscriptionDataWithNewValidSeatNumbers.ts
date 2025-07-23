import type {
  GetWorkspacePlanProductId,
  SubscriptionDataInput
} from '@/modules/gatekeeper/domain/billing'
import type { WorkspacePricingProducts } from '@/modules/gatekeeperCore/domain/billing'
import { LogicError } from '@/modules/shared/errors'
import { SubscriptionStateError } from '@/modules/gatekeeper/errors/billing'

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

  if (product === undefined && seatCount === 0) return
  if (product === undefined) {
    throw new LogicError('Product not found at mutation')
  }

  if (seatCount < 0) {
    throw new LogicError('Invalid seat count, cannot be negative')
  }

  if (product.quantity < seatCount) {
    throw new SubscriptionStateError('Subscription missing an upscale')
  }

  if (seatCount === 0) {
    const prodIndex = subscriptionData.products.indexOf(product)
    subscriptionData.products.splice(prodIndex, 1)
    return
  }

  product.quantity = seatCount
}
