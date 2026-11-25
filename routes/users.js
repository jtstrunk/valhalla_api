const { credentialsSchema } = require('../credentials')
const userService = require('../services/users')

module.exports = async function userRoutes(fastify) {
  fastify.post('/user/create', { schema: credentialsSchema }, async (request, reply) => {
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
}
