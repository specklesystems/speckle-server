import { merge } from 'lodash'
import type { StoryObj } from '@storybook/vue3'
import type { Get } from 'type-fest'

/**
 * Vue Play function type
 */
export type VuePlayFunction = NonNullable<Get<StoryObj, 'play'>>

/**
 * Combine multiple stories by merging them
 */
export function mergeStories<S = StoryObj>(
  source: S,
  ...targetsToApply: Partial<S>[]
): S {
  return merge({}, source, ...targetsToApply) as S
}
