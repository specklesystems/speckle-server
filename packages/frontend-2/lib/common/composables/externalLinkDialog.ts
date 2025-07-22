type ExternalLinkState = {
  open: boolean
  url: string
  _resolver?: (accepted: boolean) => void
}

const useSharedExternalLinkState = () =>
  useState<ExternalLinkState>('global_external_link', () => ({
    open: false,
    url: ''
  }))

export const useExternalLinkDialogController = () => {
  const state = useSharedExternalLinkState()
  const confirm = (url: string) =>
    new Promise<boolean>((resolve) => {
      state.value = { open: true, url, _resolver: resolve }
    })
  return { confirm }
}

export const useExternalLinkDialogState = () => {
  const state = useSharedExternalLinkState()
  const close = (accepted: boolean) => {
    state.value.open = false
    state.value._resolver?.(accepted)
  }
  return { state: readonly(state), close }
}
