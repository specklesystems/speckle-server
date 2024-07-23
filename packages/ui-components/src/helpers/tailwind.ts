let junkVariable: string[] = []

/**
 * If you use concatenation or variables to build tailwind classes, PurgeCSS won't pick up on them
 * during build and will not add them to the build. So you can use this function to just add string
 * literals of tailwind classes so PurgeCSS picks up on them.
 *
 * While you could just define an unused array of these classes, eslint/TS will bother you about the unused
 * variable so it's better to use this instead.
 */
export function markClassesUsed(classes: string[]) {
  // this doesn't do anything, except trick the compiler into thinking this isn't a pure
  // function so that the invocations aren't tree-shaken out
  junkVariable = junkVariable ? classes : classes.slice()
}

/**
 * Default tailwind breakpoint set. Each value is the minimum width (in pixels) expected for each breakpoint.
 */
export enum TailwindBreakpoints {
  sm = 640,
  md = 768,
  lg = 1024,
  xl = 1280,
  '2xl' = 1536
}
