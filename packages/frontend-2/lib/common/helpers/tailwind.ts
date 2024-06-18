import { TailwindBreakpoints } from '@speckle/ui-components'

/**
 * If you use concatenation or variables to build tailwind classes, PurgeCSS won't pick up on them
 * during build and will not add them to the build. So you can use this function to just add string
 * literals of tailwind classes so PurgeCSS picks up on them.
 *
 * While you could just define an unused array of these classes, eslint/TS will bother you about the unused
 * variable so it's better to use this instead.
 */
export function markClassesUsed(classes: string[]) {
  // this doesn't do anything, we just need PurgeCSS to be able to read
  // invocations of this function
  // eslint-disable-next-line no-constant-binary-expression
  false && classes
}

export { TailwindBreakpoints }
