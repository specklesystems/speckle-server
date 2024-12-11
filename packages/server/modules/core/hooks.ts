const readonlyHookFunctions: IsProjectReadOnlyHookFunction[] = []

export const registerProjectReadOnlyHook = (
  hookFunction: IsProjectReadOnlyHookFunction
) => {
  readonlyHookFunctions.push(hookFunction)
}

type IsProjectReadOnlyHookFunction = (args: { projectId: string }) => Promise<boolean>

export const isProjectReadOnly: IsProjectReadOnlyHookFunction = async (args) => {
  if (!readonlyHookFunctions.length) return false
  const hookFunctionResults = await Promise.all(
    readonlyHookFunctions.map((f) => f(args))
  )
  for (const result of hookFunctionResults) {
    if (!result) return false
  }
  return true
}
