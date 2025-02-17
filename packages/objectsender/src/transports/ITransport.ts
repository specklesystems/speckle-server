export interface ITransport {
  /**
   * Instructs the transport to write this object to its storage layer.
   * @param serialisedObject
   * @param size approximate objects size
   */
  write(serialisedObject: string, size: number): Promise<void>
  /**
   * Flushes the buffer ensuring it is persisted to its storage layer.
   */
  flush(): Promise<void>
}
