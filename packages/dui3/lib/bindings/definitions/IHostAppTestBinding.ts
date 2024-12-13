import type {
  IBinding,
  IBindingSharedEvents
} from '~~/lib/bindings/definitions/IBinding'

export const IHostAppTestBindingKey = 'hostAppTestBiding'

export interface IHostAppTestBinding extends IBinding<IHostAppTestBindingEvents> {
  getLoadedModel: () => Promise<string>
  getTests: () => Promise<ModelTest[]>
  getTestsResults: () => Promise<ModelTestResult[]>
  executeTest: (testName: string) => Promise<void>
  executeAllTests: () => Promise<void>
}

export interface IHostAppTestBindingEvents extends IBindingSharedEvents {
  setTestResult: (args: { testName: string; result: Record<string, unknown> }) => void
}

export type ModelTest = {
  name: string
  status: string
}

export type ModelTestResult = {
  name: string
  status: string
  timeStamp: string
}
