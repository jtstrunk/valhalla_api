const fastify = require('fastify')({
  logger: true
})
const { getSession } = require('./sessions')
const userRoutes = require('./routes/users')
const authRoutes = require('./routes/auth')
const gameRecordRoutes = require('./routes/game-records')

fastify.decorateRequest('userId', null)

fastify.addHook('onRequest', async (request, reply) => {
  const route = request.routeOptions.url
  if (request.method === 'POST' && (route === '/user/create' || route === '/login')) {
    return
  }

  const authorization = request.headers.authorization || ''
  const match = /^Bearer ([a-f0-9]{64})$/i.exec(authorization)
  const token = match && match[1]
  const session = token && getSession(token)
  if (!session) {
    return reply.code(401).send({ error: 'Authentication required' })
  }
  request.userId = session.userId
})

fastify.get('/', async (request, reply) => {
  return { hello: 'world' }
})

fastify.register(userRoutes, { prefix: '/user' })
fastify.register(authRoutes)
fastify.register(gameRecordRoutes, { prefix: '/game-record' })

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()