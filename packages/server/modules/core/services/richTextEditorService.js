const { trim, isString, isObjectLike } = require('lodash')

/**
 * @typedef {SmartTextEditorValueSchema}
 * @property {string} version The version of the schema
 * @property {string} type The type of value (comment, issue, blog post etc.)
 * @property {import("@tiptap/core").JSONContent} doc The ProseMirror document representing the text
 */

/**
 * Used to match URLs that can appear anywhere in a string, not perfect, but crafting a perfect
 * URL regex is quite complex and we only need this for legacy comments
 */
const MID_STRING_URL_RGX = /https?:\/\/\S+/gi

function isTextEditorDoc(value) {
  return !isString(value) && isObjectLike(value) && value.type === 'doc'
}

function isTextEditorValueSchema(value) {
  return isObjectLike(value) && value.type && value.version && value.doc
}

/**
 * Check if value is a schema serialized to string and return the schema object if so or false if not
 * @param {string} schemaJson
 * @returns {SmartTextEditorValueSchema|false}
 */
function isSerializedTextEditorValueSchema(schemaJson) {
  let deserializedSchema = undefined
  try {
    const deserializedJson = JSON.parse(schemaJson)
    if (deserializedJson && isTextEditorValueSchema(deserializedJson)) {
      deserializedSchema = deserializedJson
    }
  } catch (e) {
    // Suppressing serialization errors
  }

  return deserializedSchema || false
}

/**
 * Build a rich text document out of a basic string
 * @param {string} text
 * @returns {import("@tiptap/core").JSONContent}
 */
function convertBasicStringToDocument(text) {
  // Extract URLs and convert to text with link marks
  const urlMatches = [...text.matchAll(MID_STRING_URL_RGX)].map((m) => m[0])
  const splitTexts = text.split(MID_STRING_URL_RGX)

  const textNodes = []
  for (const textPart of splitTexts) {
    // Build text node, if text part not empty
    if (trim(textPart)) {
      textNodes.push({
        type: 'text',
        text: textPart
      })
    }

    // Get url node to append, if any remaining
    const url = urlMatches.shift()
    if (url) {
      textNodes.push({
        type: 'text',
        text: url,
        marks: [
          {
            attrs: {
              href: url,
              target: '_blank'
            },
            type: 'link'
          }
        ]
      })
    }
  }

  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: textNodes
      }
    ]
  }
}

module.exports = {
  isTextEditorValueSchema,
  isTextEditorDoc,
  isSerializedTextEditorValueSchema,
  convertBasicStringToDocument
}
