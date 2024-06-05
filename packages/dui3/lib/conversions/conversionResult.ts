export interface ConversionResult {
  /**
   * 0 = success, 1 = info, 2 = warning, 3 = error
   */
  status: 0 | 1 | 2 | 3
  /**
   * For receive conversion reports, this is the id of the speckle object. For send, it's the host app object id.
   */
  sourceId: string
  /**
   *For receive conversion reports, this is the type of the speckle object. For send, it's the host app object type.
   */
  sourceType: string
  /**
   *For receive conversion reports, this is the id of the host app object. For send, it's the speckle object id.
   */
  resultId: string
  /**
   *For receive conversion reports, this is the type of the host app object. For send, it's the speckle object type.
   */
  resultType: string
  /**
   *The exception, if any.
   */
  error?: {
    message: string
    stackTrace: string
  }
}
