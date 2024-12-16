type OnCreateObjectRequest = ({
  projectId
}: {
  projectId: string
}) => Promise<void> | void

type OnCreateVersionRequest = ({
  projectId
}: {
  projectId: string
}) => Promise<void> | void

export type HooksConfig = {
  onCreateObjectRequest: OnCreateObjectRequest[]
  onCreateVersionRequest: OnCreateVersionRequest[]
}

export type Hook = OnCreateObjectRequest | OnCreateVersionRequest

export type ExecuteHooks = (
  key: keyof HooksConfig,
  { projectId }: { projectId: string }
) => Promise<void[]>
