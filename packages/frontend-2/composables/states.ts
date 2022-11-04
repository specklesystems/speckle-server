type NavItem = {
  to: string
  name: string
  separator: boolean
}

export const useNav = () => useState<NavItem[]>('nav', () => [])
