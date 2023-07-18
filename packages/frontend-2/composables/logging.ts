export const useLogger = () => {
  const { $logger } = useNuxtApp()
  return $logger
}
