// Only need to do this because our CommonJS app does not support true-myth's export maps
declare module 'true-myth/result' {
  import { Result } from 'true-myth/dist/cjs/result.cjs'
  export * from 'true-myth/dist/cjs/result.cjs'
  export default Result
}

declare module 'true-myth' {
  export * from 'true-myth/dist/cjs/index.cjs'
}
