import { merge } from 'lodash-es'
import type { Story } from '@storybook/vue3'
import type { Get } from 'type-fest'

/**
 * Vue Play function type
 */
export type VuePlayFunction = NonNullable<Get<Story, 'play'>>

/**
 * Combine multiple stories by merging them
 */
export function mergeStories(
  source: Story,
  ...targetsToApply: Partial<Story>[]
): Story {
  return merge({}, source, ...targetsToApply) as Story
}
