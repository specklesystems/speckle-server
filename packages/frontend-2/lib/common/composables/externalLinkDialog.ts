type ExternalLinkState = {
  open: boolean
  url: string
  _resolver?: (accepted: boolean) => void
}

const _state = useState<ExternalLinkState>('global_external_link', () => ({
  open: false,
  url: ''
}))

export const useExternalLinkDialogController = () => {
  const confirm = (url: string) =>
    new Promise<boolean>((resolve) => {
      _state.value = { open: true, url, _resolver: resolve }
    })
  return { confirm }
}

export const useExternalLinkDialogState = () => {
  const close = (accepted: boolean) => {
    _state.value.open = false
    _state.value._resolver?.(accepted)
  }
  /* prevent accidental mutation */
  return {
    state: readonly(_state),
    close
  }
}
