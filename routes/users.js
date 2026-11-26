const { credentialsSchema } = require('../credentials')
const userService = require('../services/users')

module.exports = async function userRoutes(fastify) {
  fastify.post('/create', { schema: credentialsSchema }, async (request, reply) => {
    try {
      const { username, password } = request.body
      const user = await userService.createUser(username, password)
      return reply.code(201).send(user)
    } catch (err) {
      if (err instanceof userService.UsernameTakenError) {
        return reply.code(409).send({ error: 'Username already exists' })
      }
      throw err
    }
  })

  fastify.get('/users', async () => {
    return userService.listUsers()
  })

  fastify.post('/reset-password', { schema: credentialsSchema }, async (request, reply) => {
    const { username, password } = request.body
    try {
      await userService.resetPassword(request.userId, username, password)
      return reply.code(204).send()
    } catch (err) {
      if (err instanceof userService.AccountMismatchError) {
        return reply.code(403).send({ error: 'Username does not match the authenticated account' })
      }
      throw err
    }
  })

  fastify.put('/display-name', {
    schema: {
      body: {
        type: 'object',
        required: ['user_id', 'display_name'],
        additionalProperties: false,
        properties: {
          user_id: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
          display_name: { type: 'string', minLength: 1, pattern: '\\S' }
        }
      }
    }
  }, async (request, reply) => {
    const { user_id, display_name } = request.body
    try {
      userService.updateDisplayName(request.userId, user_id, display_name)
      return reply.code(204).send()
    } catch (err) {
      if (err instanceof userService.AccountMismatchError) {
        return reply.code(403).send({ error: 'Cannot update another user' })
      }
      if (err instanceof userService.PlayerNotFoundError) {
        return reply.code(404).send({ error: err.message })
      }
      if (err instanceof userService.DisplayNameTakenError) {
        return reply.code(409).send({ error: err.message })
      }
      throw err
    }
  })
}
