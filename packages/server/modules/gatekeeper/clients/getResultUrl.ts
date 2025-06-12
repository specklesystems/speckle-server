export const getResultUrl = ({
  frontendOrigin,
  workspaceId,
  workspaceSlug
}: {
  frontendOrigin: string
  workspaceSlug: string
  workspaceId: string
}) => new URL(`${frontendOrigin}/workspaces/${workspaceSlug}?workspace=${workspaceId}`)
