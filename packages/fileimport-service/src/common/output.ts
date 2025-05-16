export function isSuccessOutput(
  maybeSuccessOutput: unknown
): maybeSuccessOutput is { success: true; commitId: string } {
  return (
    !!maybeSuccessOutput &&
    typeof maybeSuccessOutput === 'object' &&
    'success' in maybeSuccessOutput &&
    typeof maybeSuccessOutput.success === 'boolean' &&
    maybeSuccessOutput.success &&
    'commitId' in maybeSuccessOutput &&
    typeof maybeSuccessOutput.commitId === 'string'
  )
}

export function isErrorOutput(
  maybeErrorOutput: unknown
): maybeErrorOutput is { success: false; error: string } {
  return (
    !!maybeErrorOutput &&
    typeof maybeErrorOutput === 'object' &&
    'error' in maybeErrorOutput &&
    typeof maybeErrorOutput.error === 'string' &&
    !!maybeErrorOutput.error
  )
}
