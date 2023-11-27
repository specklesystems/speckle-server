export const useApiOrigin = () => {
  const {
    public: { apiOrigin, backendApiOrigin }
  } = useRuntimeConfig()

  if (process.server && backendApiOrigin.length > 1) {
    return backendApiOrigin
  }

  return apiOrigin
}
