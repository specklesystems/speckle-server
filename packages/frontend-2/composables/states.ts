import { useScopedState } from '~~/lib/common/composables/scopedState'

type NavItem = {
  to: string
  name: string
  separator: boolean
}

export const useNav = () => useState<NavItem[]>('nav', () => [])

export const useTextInputGlobalFocus = () =>
  useState<boolean>('text-input-focus', () => false)
