export class RingBuffer {
  public static readonly WRITE_IDX_POS = 0
  public static readonly READ_IDX_POS = 1
  public static readonly STATE_POS = 2
  public static readonly CONTROL_BUFFER_SIZE_ELEMENTS = 3
  public static readonly CONTROL_BUFFER_BYTE_LENGTH =
    RingBuffer.CONTROL_BUFFER_SIZE_ELEMENTS * Int32Array.BYTES_PER_ELEMENT
}
