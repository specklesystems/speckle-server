// /* istanbul ignore file */
/*
This migration is fixing the duplicate user problem reported 
https://speckle.community/t/error-in-grasshopper-while-receiving-data-you-dont-have-access-to-stream-xxxxx-on-server-https-speckle-xyz-or-the-stream-does-not-exist/2003
*/

exports.up = async (knex) => {
  const roles = require('@/modules/core/roles.js')

  const Users = () => knex('users')

  // tableName, columnName that need migration
  const migrationTargets = [
    ['api_tokens', 'owner'],
    ['authorization_codes', 'userId'],
    ['branches', 'authorId'],
    ['commits', 'author'],
    ['file_uploads', 'userId'],
    ['personal_api_tokens', 'userId'],
    ['refresh_tokens', 'userId'],
    // [ 'server_acl' , 'userId' ], //userId is a PrimaryKey in this table, act accordingly
    ['server_apps', 'authorId'],
    ['server_invites', 'inviterId'],
    // [ 'stream_acl' , 'userId' ],//userId, with resourceId is a PrimaryKey in this table, act accordingly
    ['stream_activity', 'userId']
  ]

  const migrateColumnValue = async (tableName, columnName, oldUser, newUser) =>
    await knex(tableName)
      .where({ [columnName]: oldUser.id })
      .update({ [columnName]: newUser.id })

  const serverAclMigration = async ({ lowerUser, upperUser }) => {
    const oldAcl = await knex('server_acl').where({ userId: upperUser.id }).first()
    // if the old user was admin, make the target admin too
    if (oldAcl.role === 'server:admin')
      await knex('server_acl')
        .where({ userId: lowerUser.id })
        .update({ role: 'server:admin' })
  }

  const _migrateSingleStreamAccess = async ({ lowerUser, upperStreamAcl }) => {
    const upperRole = roles.filter((r) => r.name === upperStreamAcl.role)[0]
    const lowerAcl = await knex('stream_acl')
      .where({ userId: lowerUser.id, resourceId: upperStreamAcl.resourceId })
      .first()
    // see if the lowerUser has access to the stream
    if (lowerAcl) {
      // if the upper user had more access, migrate the lower user up
      const lowerRole = roles.filter((r) => r.name === lowerAcl.role)[0]
      if (lowerRole.weight < upperRole.weight)
        await knex('stream_acl')
          .where({ userId: lowerUser.id, resourceId: upperStreamAcl.resourceId })
          .update({ role: upperRole.name })
    } else {
      // if it didn't have access, just add it
      const lowerStreamAcl = { ...upperStreamAcl }
      lowerStreamAcl.userId = lowerUser.id
      await knex('stream_acl').insert(lowerStreamAcl)
    }
  }

  const streamAclMigration = async ({ lowerUser, upperUser }) => {
    const upperAcl = await knex('stream_acl').where({ userId: upperUser.id })

    await Promise.all(
      upperAcl.map(
        async (upperStreamAcl) =>
          await _migrateSingleStreamAccess({ lowerUser, upperUser, upperStreamAcl })
      )
    )
  }

  const createMigrations = ({ lowerUser, upperUser }) =>
    migrationTargets.map(([tableName, columnName]) => {
      migrateColumnValue(tableName, columnName, upperUser, lowerUser)
    })

  const userByEmailQuery = (email) => Users().where({ email })

  const getDuplicateUsers = async () => {
    const duplicates = await knex.raw(
      'select lower(email) as lowered, count(id) as reg_count from users group by lowered having count(id) > 1'
    )
    return await Promise.all(
      duplicates.rows.map(async (dup) => {
        const lowerEmail = dup.lowered

        let lowerUser = await userByEmailQuery(lowerEmail).first()
        // if no user found migrate to a random one?
        // TODO: decide 👆
        // my idea, take the first one and run with it
        if (!lowerUser)
          lowerUser = await Users()
            .whereRaw('lower(email) = lower(?)', [lowerEmail])
            .first()
        const upperUser = await Users()
          .whereRaw('lower(email) = lower(?)', [lowerEmail])
          .whereNot({ id: lowerUser.id })
          .first()
        return { lowerUser, upperUser }
      })
    )
  }

  const runMigrations = async () => {
    const duplicateUsers = await getDuplicateUsers()
    await Promise.all(
      duplicateUsers.map(async (userDouble) => {
        const migrations = createMigrations(userDouble)
        await Promise.all(migrations.map(async (migrationStep) => await migrationStep))
        await serverAclMigration(userDouble)
        await streamAclMigration(userDouble)

        // remove the now defunct user
        await userByEmailQuery(userDouble.upperUser.email).delete()
      })
    )
  }
  await runMigrations()
}

exports.down = async () => {}
