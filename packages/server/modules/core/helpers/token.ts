export const canCreateToken = (userScopes: string[], tokenScopes: string[]) => {
  return tokenScopes.every((scope) => userScopes.includes(scope))
}
