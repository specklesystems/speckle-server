import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'

export const IHostAppTestBindingKey = 'hostAppTestBiding'

export interface IHostAppTestBinding extends IBinding<IHostAppTestBindingEvents> {
  getTests: () => Promise<string[]>
  executeTest: (testName: string) => Promise<void>
  executeAllTests: () => Promise<void>
}

export interface IHostAppTestBindingEvents extends IBindingSharedEvents {
  setTestResult: (args: { testName: string; result: Record<string, unknown> }) => void
}
