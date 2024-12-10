import { z } from 'zod'

export const workspacePlanStatusValid = z.literal('valid')
export const workspacePlanStatusPaymentFailed = z.literal('paymentFailed')
export const workspacePlanStatusCancelationScheduled = z.literal('cancelationScheduled')
export const workspacePlanStatusCanceled = z.literal('canceled')
export const workspacePlanStatusExpired = z.literal('expired')
