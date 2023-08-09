export interface CTA {
  type: 'button' | 'link'
  label: string
  action: () => void | Promise<void>
}

export interface ServerInfo {
  name: string
  description: string
  adminContact: string
  company: string
  guestModeEnabled: boolean
  inviteOnly: boolean
  termsOfService: string
}

export interface SettingsDialogRef {
  onSave: () => Promise<void>
}

export interface CardInfo {
  title: string
  value: string
  cta: CTA
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
    company: string
    termsOfService: string
    inviteOnly: boolean
  }
}

export interface FormErrors {
  name?: string
  description?: string
  adminContact?: string
  company?: string
  termsOfService?: string
  inviteOnly: boolean
}
