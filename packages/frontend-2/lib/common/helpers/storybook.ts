import type { Story } from '@storybook/vue3'
import type { Get } from 'type-fest'

/**
 * Vue Play function type
 */
export type VuePlayFunction = NonNullable<Get<Story, 'play'>>
