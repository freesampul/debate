import Constants, { ExecutionEnvironment } from 'expo-constants'

// LiveKit and @livekit/react-native require native modules that are not
// available in Expo Go. All imports are deferred so the module can be
// required at startup without crashing — the actual native calls only
// happen when the user enters a room screen.

function ensureNativeLiveKitSupport(): void {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error(
      'Live audio is not available in Expo Go. Use a development build with `npm run ios` or `npm run android` in `mobile/`.'
    )
  }
}

function ensureDomExceptionSupport(): void {
  if (typeof globalThis.DOMException === 'function') return

  class RNCompatibleDOMException extends Error {
    constructor(message = '', name = 'Error') {
      super(message)
      this.name = name
    }
  }

  globalThis.DOMException = RNCompatibleDOMException as unknown as typeof DOMException
}

interface LiveKitNativeModule {
  AudioSession?: {
    startAudioSession(): Promise<void>
    stopAudioSession(): Promise<void>
  }
  registerGlobals?: () => void
  default?: {
    AudioSession?: {
      startAudioSession(): Promise<void>
      stopAudioSession(): Promise<void>
    }
    registerGlobals?: () => void
  }
}

async function loadLiveKitNative(): Promise<{
  AudioSession: {
    startAudioSession(): Promise<void>
    stopAudioSession(): Promise<void>
  }
}> {
  const livekitNative = await import('@livekit/react-native') as LiveKitNativeModule

  const registerGlobals =
    livekitNative.registerGlobals ??
    livekitNative.default?.registerGlobals

  if (typeof registerGlobals === 'function') {
    registerGlobals()
  }

  const audioSession =
    livekitNative.AudioSession ??
    livekitNative.default?.AudioSession

  if (!audioSession) {
    throw new Error(
      'LiveKit native audio session is unavailable. Rebuild the iPhone app after installing native audio dependencies.'
    )
  }

  return { AudioSession: audioSession }
}

export async function connectToRoom(token: string, url: string): Promise<import('livekit-client').Room> {
  ensureNativeLiveKitSupport()
  ensureDomExceptionSupport()

  const { AudioSession } = await loadLiveKitNative()
  const { Room } = await import('livekit-client')

  await AudioSession.startAudioSession()

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  })

  await room.connect(url, token)
  return room
}

export async function disconnectFromRoom(room: import('livekit-client').Room): Promise<void> {
  const { AudioSession } = await loadLiveKitNative()
  await room.disconnect()
  await AudioSession.stopAudioSession()
}

export async function onConnectionStateChange(
  room: import('livekit-client').Room,
  handler: (state: import('livekit-client').ConnectionState) => void,
): Promise<() => void> {
  const { RoomEvent } = await import('livekit-client')
  room.on(RoomEvent.ConnectionStateChanged, handler)
  return () => room.off(RoomEvent.ConnectionStateChanged, handler)
}
