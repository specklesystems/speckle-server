import { userEvent } from '@storybook/test'

export function rightClick(target: HTMLElement) {
  userEvent.pointer({ keys: '[MouseRight>]', target })
  userEvent.pointer({ keys: '[/MouseRight]', target })
}
