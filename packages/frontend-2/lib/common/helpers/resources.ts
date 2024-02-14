const streamRewriteRgx = /stream(?=$|s|\W)/gi
const branchRewriteRgx = /branch(es)?(?=$|\W)/gi
const commitRewriteRgx = /commit(?=$|s|\W)/gi

export function isObjectId(id: string) {
  return id.length === 32
}

export const buildModelTreeItemId = (projectId: string, fullName: string) =>
  `${projectId}-${fullName}`

/**
 * Converts old terminology (streams, branches, commits, etc.) to new one (projects, models, versions)
 */
export const toNewProductTerminology = (str: string): string => {
  return str
    .replaceAll(streamRewriteRgx, (match) =>
      match === match.toUpperCase() ? 'Project' : 'project'
    )
    .replaceAll(branchRewriteRgx, (match) => {
      const shouldBeUppercase = match === match.toUpperCase()
      if (match === 'branches') {
        return shouldBeUppercase ? 'Models' : 'models'
      } else {
        return shouldBeUppercase ? 'Model' : 'model'
      }
    })
    .replaceAll(commitRewriteRgx, (match) =>
      match === match.toUpperCase() ? 'Version' : 'version'
    )
}
