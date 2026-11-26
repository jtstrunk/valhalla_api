const db = require('../database')

const usp_findGame = db.prepare(`
  SELECT game_name, minimum_player_count, maximum_player_count
  FROM supported_games WHERE game_id = ?
`)
const usp_findPlayer = db.prepare('SELECT id FROM players WHERE id = ?')
const usp_findPlayerByName = db.prepare('SELECT id FROM players WHERE display_name = ?')
const usp_insertPlayer = db.prepare('INSERT INTO players (display_name) VALUES (?)')
const usp_insertRecord = db.prepare(`
  INSERT INTO game_records (game_id, played_on, recorded_by_user_id, win_condition, mode, extra_details)
  VALUES (?, ?, ?, ?, ?, ?)
`)
const usp_insertParticipant = db.prepare(`
  INSERT INTO game_participants (game_record_id, player_id, placement, points, win_condition, team_name, extra_details)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)
const usp_findRecord = db.prepare(`
  SELECT r.id, r.game_id, g.game_name, r.played_on, r.recorded_by_user_id,
         recorder.username AS recorded_by_username,
         recorder_player.display_name AS recorded_by_display_name,
         r.win_condition, r.mode, r.extra_details
  FROM game_records r JOIN supported_games g ON g.game_id = r.game_id
  JOIN users recorder ON recorder.id = r.recorded_by_user_id
  LEFT JOIN players recorder_player ON recorder_player.user_id = recorder.id
  WHERE r.id = ?
`)
const usp_findParticipants = db.prepare(`
  SELECT p.participant_id, p.player_id, COALESCE(player.display_name, account.username) AS name, player.user_id,
         p.placement, p.points, p.win_condition, p.team_name, p.extra_details
  FROM game_participants p JOIN players player ON player.id = p.player_id
  LEFT JOIN users account ON account.id = player.user_id
  WHERE p.game_record_id = ? ORDER BY p.participant_id
`)

class InvalidRecordError extends Error {
  constructor(message) {
    super(message)
    this.name = 'InvalidRecordError'
  }
}

function serializeDetails(details) {
  return details == null ? null : JSON.stringify(details)
}

function parseDetails(row) {
  const { extra_details, ...values } = row
  if (extra_details != null) values.extra_details = JSON.parse(extra_details)
  return values
}

function getRecord(id) {
  const record = usp_findRecord.get(id)
  if (!record) return undefined

  const saved = parseDetails(record)
  saved.game_participants = usp_findParticipants.all(id).map(parseDetails)
  return saved
}

function createRecord(userId, record) {
  db.exec('BEGIN IMMEDIATE')
  try {
    const game = usp_findGame.get(record.game_id)
    if (!game) throw new InvalidRecordError('Game does not exist')

    const count = record.game_participants.length
    if (count < game.minimum_player_count || count > game.maximum_player_count) {
      throw new InvalidRecordError('Participant count is outside the game player limits')
    }
    
    const result = usp_insertRecord.run(
      record.game_id, record.played_on, userId, record.win_condition ?? null,
      record.mode ?? null, serializeDetails(record.extra_details)
    )
    const id = result.lastInsertRowid
    const playerIds = new Set()
    for (const participant of record.game_participants) {
      let playerId = participant.player_id
      if (playerId !== undefined) {
        if (!usp_findPlayer.get(playerId)) {
          throw new InvalidRecordError(`Player ${playerId} does not exist`)
        }
      } else {
        if (usp_findPlayerByName.get(participant.name)) {
          throw new InvalidRecordError(`Player name "${participant.name}" already exists; use its player_id`)
        }
        playerId = usp_insertPlayer.run(participant.name).lastInsertRowid
      }
      if (playerIds.has(playerId)) {
        throw new InvalidRecordError('Each player can participate only once')
      }
      playerIds.add(playerId)
      usp_insertParticipant.run(
        id, playerId, participant.placement ?? null, participant.points ?? null,
        participant.win_condition ?? null, participant.team_name ?? null,
        serializeDetails(participant.extra_details)
      )
    }
    db.exec('COMMIT')
  } catch (err) {
    try {
      db.exec('ROLLBACK')
    } catch (rollbackError) {
      throw new AggregateError([err, rollbackError], 'Failed to create record and roll back transaction')
    }
    throw err
  }
}

module.exports = { createRecord, getRecord, InvalidRecordError }
