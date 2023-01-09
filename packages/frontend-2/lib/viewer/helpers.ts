export function useGetObjectUrl() {
  const config = useRuntimeConfig()
  return (projectId: string, objectId: string) =>
    `${config.public.apiOrigin}/streams/${projectId}/objects/${objectId}`
}

export function useGetPreviewUrl() {
  const config = useRuntimeConfig()
  return (projectId: string, resourceId: string) =>
    `${config.public.apiOrigin}/preview/${projectId}/${
      resourceId.length === 32 ? 'objects' : 'commits'
    }/${resourceId}`
}
