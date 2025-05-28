export const ViewerLimitsDialogType = {
  Version: 'version',
  Comment: 'comment',
  Federated: 'federated'
} as const
export type ViewerLimitsDialogType =
  (typeof ViewerLimitsDialogType)[keyof typeof ViewerLimitsDialogType]
