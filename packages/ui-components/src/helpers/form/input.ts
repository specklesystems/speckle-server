import { getClientOperatingSystem, OperatingSystem } from '@speckle/shared'

export enum ModifierKeys {
  CtrlOrCmd = 'cmd-or-ctrl',
  AltOrOpt = 'alt-or-opt',
  Shift = 'shift'
}

export const clientOs = getClientOperatingSystem()

export const ModifierKeyTitles: Record<ModifierKeys, string> = {
  [ModifierKeys.CtrlOrCmd]: clientOs === OperatingSystem.Mac ? '⌘' : '⌃',
  [ModifierKeys.AltOrOpt]: clientOs === OperatingSystem.Mac ? '⌥' : '⌥',
  [ModifierKeys.Shift]: '⇧'
}

export function getKeyboardShortcutTitle(keys: Array<string | ModifierKeys>) {
  const isModifierKey = (k: string): k is ModifierKeys =>
    (Object.values(ModifierKeys) as string[]).includes(k)

  return keys.map((v) => (isModifierKey(v) ? ModifierKeyTitles[v] : v)).join('')
}
