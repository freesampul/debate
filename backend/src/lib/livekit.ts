import { AccessToken, VideoGrant } from 'livekit-server-sdk'

const apiKey = process.env.LIVEKIT_API_KEY
const apiSecret = process.env.LIVEKIT_API_SECRET

if (!apiKey || !apiSecret) {
  throw new Error('Missing required LiveKit environment variables')
}

/** Maximum token lifetime — 2 hours per SECURITY.md §7 */
const TOKEN_TTL_SECONDS = 7200

/**
 * Generate a short-lived, room-scoped, user-scoped LiveKit access token.
 * Tokens must be generated fresh each time a user joins (never reused).
 */
export async function createLiveKitToken(params: {
  roomName: string
  participantIdentity: string
  canPublish: boolean
  /** JSON string passed through to the client via participant.metadata */
  participantMetadata?: string
}): Promise<string> {
  const { roomName, participantIdentity, canPublish, participantMetadata } = params

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: participantIdentity,
    ttl: TOKEN_TTL_SECONDS,
    metadata: participantMetadata,
  })

  token.addGrant(grant)

  return token.toJwt()
}
