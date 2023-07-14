export interface ITestBinding {
  sayHi: (name: string, count: number, sayHelloNotHi: boolean) => Promise<string[]>
  goAway: () => Promise<void>
  getComplexType: () => Promise<ComplexType>
  on: <E extends keyof ITestBindingEvents>(
    event: E,
    callback: ITestBindingEvents[E]
  ) => void
}

export interface ITestBindingEvents {
  emptyTestEvent: () => void
  testEvent: (args: TestEventArgs) => void
}

export type TestEventArgs = {
  name: string
  isOk: boolean
  count: number
}

export type ComplexType = {
  id: string
  count: number
}
