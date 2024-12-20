type OnCreateObjectRequest = ({
  projectId
}: {
  projectId: string
}) => Promise<void> | void

export type HooksConfig = {
  onCreateObjectRequest: OnCreateObjectRequest[]
}

export type Hook = OnCreateObjectRequest

export type ExecuteHooks = (
  key: keyof HooksConfig,
  { projectId }: { projectId: string }
) => Promise<void[]>
