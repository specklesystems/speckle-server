export const useFeatureFlags = () => {
  const config = useRuntimeConfig()
  return config.public
}
