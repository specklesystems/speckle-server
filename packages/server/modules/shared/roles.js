const knex = require(`@/db/knex`)
let roles

const getRoles = async () => {
  if (roles) return roles
  roles = await knex('user_roles').select('*')
  return roles
}

module.exports = {
  getRoles
}
