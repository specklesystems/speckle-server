export const useTextInputGlobalFocus = () =>
  useState<boolean>('text-input-focus', () => false)
