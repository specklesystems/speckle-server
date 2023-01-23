export function useGetObjectUrl() {
  const config = useRuntimeConfig()
  return (projectId: string, objectId: string) =>
    `${config.public.apiOrigin}/streams/${projectId}/objects/${objectId}`
}
