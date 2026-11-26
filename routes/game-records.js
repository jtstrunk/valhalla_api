const gameRecords = require('../services/game-records')

const nullableString = { type: ['string', 'null'] }
const extraDetails = { type: ['object', 'null'], additionalProperties: true }
const identifier = { type: 'integer', minimum: Number.MIN_SAFE_INTEGER, maximum: Number.MAX_SAFE_INTEGER }

const createRecordSchema = {
  body: {
    type: 'object',
    required: ['game_id', 'played_on', 'game_participants'],
    additionalProperties: false,
    properties: {
      game_id: identifier,
      played_on: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
      win_condition: nullableString,
      mode: nullableString,
      extra_details: extraDetails,
      game_participants: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          anyOf: [{ required: ['player_id'] }, { required: ['name'] }],
          additionalProperties: false,
          properties: {
            player_id: identifier,
            name: { type: 'string', minLength: 1, pattern: '\\S' },
            placement: { type: ['integer', 'null'] },
            points: { type: ['number', 'null'] },
            win_condition: nullableString,
            team_name: nullableString,
            extra_details: extraDetails
          }
        }
      }
    }
  }
}

module.exports = async function gameRecordRoutes(fastify) {
  fastify.post('/add-record', { schema: createRecordSchema }, async (request, reply) => {
    try {
      gameRecords.createRecord(request.userId, request.body)
      return reply.code(201).send({ message: 'insert successful' })
    } catch (err) {
      if (err instanceof gameRecords.InvalidRecordError) {
        return reply.code(400).send({ error: err.message })
      }
      throw err
    }
  })

  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: identifier }
      }
    }
  }, async (request, reply) => {
    const record = gameRecords.getRecord(request.params.id)
    if (!record) return reply.code(404).send({ error: 'Game record not found' })
    return record
  })
}
