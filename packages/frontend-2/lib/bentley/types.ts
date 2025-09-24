import type { Integration } from '~/lib/integrations/types'
import bentleyLogo from '~/assets/images/integrations/bentley.png'

export const BentleyIntegration: Integration = {
  cookieKey: 'bentley_itwin_tokens',
  name: 'Bentley ProjectWise',
  description: 'Sync your files in Bentley ProjectWise into Speckle.',
  logo: bentleyLogo,
  connected: false,
  enabled: true, // TODO: do false later when it is a
  status: 'notConnected'
}
