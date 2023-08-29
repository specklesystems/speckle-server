import { userEvent } from '@storybook/testing-library'

export function rightClick(target: HTMLElement) {
  userEvent.pointer({ keys: '[MouseRight>]', target })
  userEvent.pointer({ keys: '[/MouseRight]', target })
}
