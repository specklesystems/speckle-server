export interface CTA {
  type: 'button' | 'link'
  label: string
  action: () => void | Promise<void>
}

export interface ServerInfo {
  title: string
  value: string
  cta?: CTA | null
}

export interface SettingsDialogRef {
  onSave: () => Promise<void>
}

export interface ServerStatistics {
  admin: {
    serverStatistics: {
      totalPendingInvites: number
      totalProjectCount: number
      totalUserCount: number
    }
  }
  serverInfo: {
    name: string
    version: string
  }
}

export interface Button {
  text: string
  props: { color: string; fullWidth: boolean; outline: boolean }
  onClick: () => void
}

export interface ServerInfoResponse {
  serverInfo: {
    name: string
    description: string
    adminContact: string
  }
}

export interface FormErrors {
  name?: string
  description?: string
  adminContact?: string
}
