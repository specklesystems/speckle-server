export interface ITransport {
  /**
   * Instructs the transport to write this object to its storage layer.
   * @param serialisedObject
   * @param size approximate objects size
   * @param objectId id of the serialised object
   */
  write(serialisedObject: string, size: number, objectId: string): Promise<void>
  /**
   * Flushes the buffer ensuring it is persisted to its storage layer.
   */
  flush(): Promise<void>
}
