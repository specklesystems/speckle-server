export interface ConversionResult {
  /**
   * 1 = success, 2 = info, 3 = warning, 4 = error
   */
  status: 1 | 2 | 3 | 4
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
  /**
   * This currently inherits from base
   */
  speckle_type: string
}
