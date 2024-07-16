import JsLogger from 'js-logger'
import { has, get } from 'lodash-es'

const Logger = (
  has(JsLogger, 'warn') ? JsLogger : get(JsLogger, 'default')
) as JsLogger.GlobalLogger
export default Logger
