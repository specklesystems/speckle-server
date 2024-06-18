import { AutomationCreationError } from '@/modules/automate/errors/management'

export const validateAutomationName = (automationName: string): void => {
  const nameLength = automationName?.length || 0
  if (nameLength < 1 || nameLength > 255) {
    throw new AutomationCreationError(
      'Automation name should be a string between the length of 1 and 255 characters.'
    )
  }
}
