export default interface Queue<T> {
  add(value: T): Promise<void>
  disposeAsync(): Promise<void>
}
