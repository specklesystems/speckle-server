import { Nullable } from './utilityTypes'

export enum OperatingSystem {
  Windows = 'win',
  Mac = 'mac',
  Linux = 'linux',
  Android = 'android',
  iOS = 'ios',
  Other = 'other'
}

function resolveOsFromPlatform(): Nullable<OperatingSystem> {
  if (!globalThis || !globalThis.navigator || !('platform' in globalThis.navigator)) {
    return null
  }

  const platform = (globalThis.navigator.platform || '').toLowerCase()
  if (platform.startsWith('mac')) return OperatingSystem.Mac
  if (
    platform.startsWith('linux') ||
    platform.startsWith('freebsd') ||
    platform.startsWith('sunos')
  )
    return OperatingSystem.Linux
  if (platform.startsWith('win')) return OperatingSystem.Windows
  if (
    platform.startsWith('iphone') ||
    platform.startsWith('ipad') ||
    platform.startsWith('ipod')
  )
    return OperatingSystem.iOS
  if (platform.startsWith('android')) return OperatingSystem.Android

  return OperatingSystem.Other
}

function resolveOsFromUserAgent(): Nullable<OperatingSystem> {
  if (!globalThis || !globalThis.navigator || !('userAgent' in globalThis.navigator)) {
    return null
  }

  const userAgent = globalThis.navigator.userAgent
  if (userAgent.includes('X11') || userAgent.includes('Linux'))
    return OperatingSystem.Linux
  if (userAgent.includes('Win')) return OperatingSystem.Windows
  if (userAgent.includes('Mac')) return OperatingSystem.Mac
  if (userAgent.includes('Android')) return OperatingSystem.Android
  if (
    userAgent.includes('iPhone') ||
    userAgent.includes('iPad') ||
    userAgent.includes('iPhone')
  )
    return OperatingSystem.iOS
  return OperatingSystem.Other
}

export function getClientOperatingSystem() {
  if (!globalThis || !globalThis.navigator) {
    // Skipped in server-side
    return OperatingSystem.Other
  }

  const osFromPlatform = resolveOsFromPlatform()

  // If Linux it could actually be Android, so let's check userAgent
  if (
    osFromPlatform &&
    ![OperatingSystem.Other, OperatingSystem.Linux].includes(osFromPlatform)
  ) {
    return osFromPlatform
  }

  const userAgentPlatform = resolveOsFromUserAgent()
  return userAgentPlatform || OperatingSystem.Other
}
