import Constants, { ExecutionEnvironment } from 'expo-constants'
import { supabase } from './supabase'
import type {
  Room,
  RoomParticipant,
  RoomParticipantWithUser,
  VoteCounts,
  VoteSide,
  MediaType,
  ParticipantRole,
  Question,
  SpeakerInvite,
  SpeakerInviteWithUser,
  Notification,
  UserProfile,
} from '@debate-app/shared'

export interface QuestionDetails {
  question: Question
  activeRoom: Room | null
  liveRooms: Room[]
  recentRooms: Room[]
}

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL
if (!rawApiUrl) {
  console.warn('[api] EXPO_PUBLIC_API_URL is not set — API calls will fail until the backend URL is configured.')
}
const API_URL: string = rawApiUrl ?? 'http://localhost:3000'

function isExpoGo(): boolean {
  return (
    Constants?.executionEnvironment === ExecutionEnvironment.StoreClient
  )
}

/** Expo Go cannot use our ATS overrides; iOS blocks http:// to LAN IPs. */
function expoGoHttpLanHint(): string | null {
  if (!isExpoGo()) return null
  try {
    const u = new URL(API_URL)
    if (u.protocol !== 'http:') return null
    const host = u.hostname
    if (host === 'localhost' || host === '127.0.0.1') return null
    return (
      'Expo Go on a physical device cannot use plain HTTP to your computer. ' +
      'Set EXPO_PUBLIC_API_URL to an HTTPS URL (e.g. ngrok/cloudflared tunnel to port 3000), ' +
      'or run a dev build so native config applies: npx expo run:ios'
    )
  } catch {
    return null
  }
}

function isNgrokHost(hostname: string): boolean {
  return (
    hostname.endsWith('ngrok-free.app') ||
    hostname.endsWith('ngrok-free.dev') ||
    hostname.endsWith('ngrok.io') ||
    hostname.endsWith('ngrok.app')
  )
}

function networkFailureHint(): string {
  try {
    const u = new URL(API_URL)
    if (isNgrokHost(u.hostname)) {
      return (
        'Ngrok: use the full hostname (ngrok truncates in the terminal). Run `npm run sync-ngrok` in mobile/ ' +
        'or copy the URL from http://127.0.0.1:4040. Ensure `ngrok http 3000` and the backend are running.'
      )
    }
  } catch {
    /* ignore */
  }
  return 'Confirm the backend is running and EXPO_PUBLIC_API_URL is reachable from your phone (same Wi‑Fi or HTTPS tunnel).'
}

function wrapNetworkError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg === 'Network request failed') {
    const lan = expoGoHttpLanHint()
    if (lan) throw new Error(`${msg}. ${lan}`)
    throw new Error(`${msg}. ${networkFailureHint()}`)
  }
  throw err
}

/** Headers for all API calls (ngrok free tier expects this exact header value for non-browser clients). */
function baseHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
  try {
    if (isNgrokHost(new URL(API_URL).hostname)) {
      h['ngrok-skip-browser-warning'] = '69420'
    }
  } catch {
    /* ignore */
  }
  return h
}

/** GET endpoints that do not require a Supabase session (matches backend routes). */
async function apiFetchPublic<T>(path: string): Promise<T> {
  const url = `${API_URL}/api/v1${path}`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: baseHeaders(),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
      throw new Error(body.error ?? `Request failed with status ${response.status}`)
    }
    return response.json() as Promise<T>
  } catch (err) {
    wrapNetworkError(err)
  }
}

async function getAuthToken(): Promise<string> {
  const DEV_BYPASS = process.env.EXPO_PUBLIC_DEV_BYPASS === 'true'

  const { data: { session }, error } = await supabase.auth.getSession()

  // If we have a real session, validate and potentially refresh it
  if (!error && session) {
    const expiresAt = session.expires_at ?? 0
    const nowPlusBuffer = Math.floor(Date.now() / 1000) + 30
    if (expiresAt < nowPlusBuffer) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession()
      if (!refreshError && refreshed.session) {
        return refreshed.session.access_token
      }
      // Refresh failed — fall through to dev bypass or throw
    } else {
      return session.access_token
    }
  }

  // No real session: use dev bypass if available, otherwise fail
  if (DEV_BYPASS) return 'dev-token'
  throw new Error('Not authenticated. Please sign in.')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}/api/v1${path}`
  try {
    const token = await getAuthToken()
    const response = await fetch(url, {
      ...options,
      headers: {
        ...baseHeaders(),
        Authorization: `Bearer ${token}`,
        ...(options.headers as Record<string, string> | undefined),
      },
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Unknown error' })) as { error?: string }
      throw new Error(body.error ?? `Request failed with status ${response.status}`)
    }

    return response.json() as Promise<T>
  } catch (err) {
    wrapNetworkError(err)
  }
}

// Rooms

export async function listRooms(): Promise<Room[]> {
  const data = await apiFetchPublic<{ rooms: Room[] }>('/rooms')
  return data.rooms
}

export async function getRoom(id: string): Promise<Room> {
  const data = await apiFetchPublic<{ room: Room }>(`/rooms/${id}`)
  return data.room
}

export async function createRoom(payload: {
  title: string
  topic: string
  max_speakers: number
  question_id: string
}): Promise<Room> {
  const data = await apiFetch<{ room: Room }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.room
}

export async function joinRoom(
  roomId: string,
  role: ParticipantRole,
  mediaType: MediaType = 'audio',
): Promise<RoomParticipant> {
  const data = await apiFetch<{ participant: RoomParticipant }>(`/rooms/${roomId}/join`, {
    method: 'POST',
    body: JSON.stringify({ role, media_type: mediaType }),
  })
  return data.participant
}

export async function leaveRoom(roomId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/leave`, { method: 'POST' })
}

export async function endRoom(roomId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/end`, { method: 'POST' })
}

// Voting

export async function castVote(roomId: string, side: VoteSide): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/votes`, {
    method: 'POST',
    body: JSON.stringify({ side }),
  })
}

export async function getVoteCounts(roomId: string): Promise<VoteCounts> {
  const data = await apiFetchPublic<{ counts: VoteCounts }>(`/rooms/${roomId}/votes`)
  return data.counts
}

// Room lifecycle

export async function startRoom(roomId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/start`, { method: 'POST' })
}

// Questions

export async function listQuestions(): Promise<Question[]> {
  const data = await apiFetchPublic<{ questions: Question[] }>('/questions')
  return data.questions
}

export async function getQuestion(id: string): Promise<QuestionDetails> {
  return apiFetchPublic<QuestionDetails>(`/questions/${id}`)
}

export async function submitQuestion(content: string): Promise<Question> {
  const data = await apiFetch<{ question: Question }>('/questions', {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
  return data.question
}

export async function voteQuestion(id: string): Promise<{ voted: boolean }> {
  return apiFetch<{ voted: boolean }>(`/questions/${id}/vote`, { method: 'POST' })
}

// Users / Profiles

export async function getMyProfile(): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>('/users/me')
  return data.profile
}

export async function updateMyProfile(payload: {
  username: string
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
}): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data.profile
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const data = await apiFetch<{ profile: UserProfile }>(`/users/${userId}`)
  return data.profile
}

export async function followUser(userId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/users/${userId}/follow`, { method: 'POST' })
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/users/${userId}/follow`, { method: 'DELETE' })
}

// Notifications

export async function listNotifications(): Promise<Notification[]> {
  const data = await apiFetch<{ notifications: Notification[] }>('/notifications')
  return data.notifications
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/notifications/${id}/read`, { method: 'POST' })
}

// Messages

export async function sendMessage(roomId: string, content: string): Promise<void> {
  await apiFetch<{ message: unknown }>(`/rooms/${roomId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  })
}

export async function removeMessage(roomId: string, messageId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/messages/${messageId}`, {
    method: 'DELETE',
  })
}

export async function reportMessage(
  roomId: string,
  messageId: string,
  category: 'harassment' | 'hate_or_abuse' | 'spam' | 'sexual_content' | 'violent_or_dangerous' | 'impersonation' | 'off_topic_disruption',
  details?: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/messages/${messageId}/report`, {
    method: 'POST',
    body: JSON.stringify({ category, details }),
  })
}

export async function reportRoom(
  questionId: string,
  roomId: string,
  category: 'harassment' | 'hate_or_abuse' | 'spam' | 'sexual_content' | 'violent_or_dangerous' | 'impersonation' | 'off_topic_disruption',
  details?: string,
): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/questions/${questionId}/report-room/${roomId}`, {
    method: 'POST',
    body: JSON.stringify({ category, details }),
  })
}

// Participants

export async function getParticipants(roomId: string): Promise<RoomParticipantWithUser[]> {
  const data = await apiFetchPublic<{ participants: RoomParticipantWithUser[] }>(`/rooms/${roomId}/participants`)
  return data.participants
}

export async function removeParticipant(roomId: string, userId: string, reason?: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/participants/${userId}/remove`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

export async function banParticipant(roomId: string, userId: string, reason?: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/participants/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// Speaker invites

export async function getInvites(roomId: string): Promise<SpeakerInviteWithUser[]> {
  const data = await apiFetchPublic<{ invites: SpeakerInviteWithUser[] }>(`/rooms/${roomId}/invites`)
  return data.invites
}

export async function inviteSpeaker(roomId: string, invitedUserId: string): Promise<SpeakerInvite> {
  const data = await apiFetch<{ invite: SpeakerInvite }>(`/rooms/${roomId}/invites`, {
    method: 'POST',
    body: JSON.stringify({ invited_user_id: invitedUserId }),
  })
  return data.invite
}

export async function acceptInvite(roomId: string, inviteId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/invites/${inviteId}/accept`, { method: 'POST' })
}

export async function declineInvite(roomId: string, inviteId: string): Promise<void> {
  await apiFetch<{ ok: boolean }>(`/rooms/${roomId}/invites/${inviteId}/decline`, { method: 'POST' })
}

// LiveKit

export async function getLiveKitToken(roomId: string): Promise<{ token: string; livekitUrl: string }> {
  const data = await apiFetch<{ token: string; livekit_url: string }>('/livekit/token', {
    method: 'POST',
    body: JSON.stringify({ room_id: roomId }),
  })
  return { token: data.token, livekitUrl: data.livekit_url }
}
