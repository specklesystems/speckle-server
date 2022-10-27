const { graphSchema } = require('@/modules/index')

/**
 * Used in codegen.yml
 */

const schema = graphSchema()
module.exports = schema
