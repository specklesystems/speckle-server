export default interface Queue<T> {
  add(value: T): void
  disposeAsync(): Promise<void>
}
