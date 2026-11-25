const { credentialsSchema } = require('../credentials')
const { login, InvalidCredentialsError } = require('../services/auth')

module.exports = async function authRoutes(fastify) {
  fastify.post('/login', { schema: credentialsSchema }, async (request, reply) => {
    const { username, password } = request.body
    try {
      return await login(username, password)
    } catch (err) {
      if (err instanceof InvalidCredentialsError) {
        return reply.code(401).send({ error: 'Invalid username or password' })
      }
      throw err
    }
  })
}
