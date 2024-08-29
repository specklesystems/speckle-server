/**
 * Replaces a string in pino's template format with the provided values, returning the complete message.
 * Note that this is similar but is not the same as messagetemplates.org format.
 * To template a string, place the property name between curly brackets. e.g. {key}.
 * An improvement over messagetemplates.org is that you can use nested keys e.g. {key.nestedKey.subKey} to deeply access within objects.
 * An improvement over messagetemplates.org is that you can use conditional formatting, e.g. {if key}some text{end}. Note that {else} statements are not supported.
 * Limitation: Brackets cannot yet be escaped.
 * Limitation: Cannot prefix with @ or $ to control how a property is captured
 * Limitation: Property names cannot be suffixed with any optional format, e.g. :000, to control how the property is rendered
 * Original code from https://github.com/pinojs/pino-pretty/blob/master/lib/utils/prettify-message.js
 * Originally licensed under an MIT License: https://github.com/pinojs/pino-pretty?tab=MIT-1-ov-file#readme
 */
export const prettifyMessage = (values: Record<string, unknown>, message: string) => {
  const parsedMessageFormat = interpretConditionals(message, values)

  const msg = String(parsedMessageFormat).replace(/{([^{}]+)}/g, function (match, p1) {
    // Parse nested key access, e.g. `{keyA.subKeyB}`.
    return getPropertyValue(values, p1) || ''
  })

  return msg
}

const getPropertyValue = (obj: unknown, property: string | string[]): string => {
  const props = Array.isArray(property) ? property : splitPropertyKey(property)

  for (const prop of props) {
    if (!Object.prototype.hasOwnProperty.call(obj, prop)) {
      return ''
    }
    obj = (<Record<string, unknown>>obj)[prop]
  }

  if (typeof obj === 'string') {
    return obj
  }

  return JSON.stringify(obj)
}

/**
 * Translates all conditional blocks from within the messageFormat. Translates
 * any matching {if key}{key}{end} statements and returns everything between
 * if and else blocks if the key provided was found in log.
 *
 * @param {MessageFormatString|MessageFormatFunction} messageFormat A format
 * string or function that defines how the logged message should be
 * conditionally formatted.
 * @param {object} log The log object to be modified.
 *
 * @returns {string} The parsed messageFormat.
 */
function interpretConditionals(messageFormat: string, log: Record<string, unknown>) {
  messageFormat = messageFormat.replace(/{if (.*?)}(.*?){end}/g, replacer)

  // Remove non-terminated if blocks
  messageFormat = messageFormat.replace(/{if (.*?)}/g, '')
  // Remove floating end blocks
  messageFormat = messageFormat.replace(/{end}/g, '')

  return messageFormat.replace(/\s+/g, ' ').trim()

  function replacer(_: unknown, key: string, value: string) {
    const propertyValue = getPropertyValue(log, key)
    if (propertyValue) {
      return value
    } else {
      return ''
    }
  }
}

/**
 * Splits the property key delimited by a dot character but not when it is preceded
 * by a backslash.
 *
 * @param {string} key A string identifying the property.
 *
 * @returns {string[]} Returns a list of string containing each delimited property.
 * e.g. `'prop2\.domain\.corp.prop2'` should return [ 'prop2.domain.com', 'prop2' ]
 */
function splitPropertyKey(key: string): string[] {
  const result = []
  let backslash = false
  let segment = ''

  for (let i = 0; i < key.length; i++) {
    const c = key.charAt(i)

    if (c === '\\') {
      backslash = true
      continue
    }

    if (backslash) {
      backslash = false
      segment += c
      continue
    }

    /* Non-escaped dot, push to result */
    if (c === '.') {
      result.push(segment)
      segment = ''
      continue
    }

    segment += c
  }

  /* Push last entry to result */
  if (segment.length) {
    result.push(segment)
  }

  return result
}
