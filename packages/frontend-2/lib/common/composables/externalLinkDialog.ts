type ExternalLinkState = {
  open: boolean
  url: string
  _resolver?: (accepted: boolean) => void
}

const useGlobalExternalLinkDialog = () => {
  const state = useState<ExternalLinkState>('global_external_link', () => ({
    open: false,
    url: ''
  }))

  const confirm = (url: string) =>
    new Promise<boolean>((resolve) => {
      state.value = { open: true, url, _resolver: resolve }
    })

  return { state, confirm }
}
export { useGlobalExternalLinkDialog }
