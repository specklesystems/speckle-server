export const useAreSavedViewsEnabled = () => {
  const {
    public: { FF_SAVED_VIEWS_ENABLED }
  } = useRuntimeConfig()

  return FF_SAVED_VIEWS_ENABLED
}
