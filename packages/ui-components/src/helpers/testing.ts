import { userEvent } from '@storybook/test'

export async function rightClick(target: HTMLElement) {
  await userEvent.pointer({ keys: '[MouseRight>]', target })
  await userEvent.pointer({ keys: '[/MouseRight]', target })
}
