export const convertEmailStatusToEnum = (status: string) => {
  switch (status.trim().toLowerCase()) {
    case 'queued':
    case 'pending':
    case 'sent':
    case 'failed':
      return status.trim().toUpperCase()
    default:
      return 'FAILED'
  }
}
