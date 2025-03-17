import { blockedSlugs } from '../../core/constants.js'

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
    .slice(0, MAX_SLUG_LENGTH)
}

export function validateWorkspaceSlug(slug: string): void {
  if (slug.length < MIN_SLUG_LENGTH) {
    throw new InvalidWorkspaceSlugError(
      `Short ID must be at least ${MIN_SLUG_LENGTH} characters long.`
    )
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    throw new InvalidWorkspaceSlugError(
      `Short ID must not exceed ${MAX_SLUG_LENGTH} characters.`
    )
  }

  if (!VALID_SLUG_CHARACTERS_REGEX.test(slug)) {
    throw new InvalidWorkspaceSlugError(
      'Short ID must contain only lowercase letters, numbers, and hyphens.'
    )
  }

  if (!VALID_SLUG_BOUNDARY_REGEX.test(slug)) {
    throw new InvalidWorkspaceSlugError('Short ID cannot start or end with a hyphen.')
  }

  if (blockedSlugs.includes(slug)) {
    throw new InvalidWorkspaceSlugError('This Short ID is reserved and cannot be used.')
  }
}
