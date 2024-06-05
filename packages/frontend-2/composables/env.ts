/**
 * IMPORTANT: Don't use this directly in Vue templates that may render in SSR, cause this may cause the backend API origin to be rendered instead of the clientside one,
 * at least until the app finishes hydrating. If people click on links based on this too early, they may end up in the wrong place.
 */
export const useApiOrigin = () => {
  const {
    public: { apiOrigin, backendApiOrigin }
  } = useRuntimeConfig()

  if (process.server && backendApiOrigin.length > 1) {
    return backendApiOrigin
  }

  return apiOrigin
}
