export const VALID_SLUG_CHARACTERS_REGEX = /^[a-z0-9-]+$/
export const VALID_SLUG_BOUNDARY_REGEX = /^[a-z0-9].*[a-z0-9]$/
const MIN_SLUG_LENGTH = 3
const MAX_SLUG_LENGTH = 30

export class InvalidWorkspaceSlugError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidWorkspaceSlugError'
  }
}

export const generateSlugFromName = ({ name }: { name: string }): string => {
  return name
    .replace(/ /g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
}

export function validateWorkspaceSlug(slug: string): void {
  if (slug.length < MIN_SLUG_LENGTH) {
    throw new InvalidWorkspaceSlugError(
      `Workspace slug must be at least ${MIN_SLUG_LENGTH} characters long.`
    )
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    throw new InvalidWorkspaceSlugError(
      `Workspace slug must not exceed ${MAX_SLUG_LENGTH} characters.`
    )
  }

  if (!VALID_SLUG_CHARACTERS_REGEX.test(slug)) {
    throw new InvalidWorkspaceSlugError(
      'Workspace slug must contain only lowercase letters, numbers, and hyphens.'
    )
  }

  if (!VALID_SLUG_BOUNDARY_REGEX.test(slug)) {
    throw new InvalidWorkspaceSlugError(
      'Workspace slug cannot start or end with a hyphen.'
    )
  }
}
