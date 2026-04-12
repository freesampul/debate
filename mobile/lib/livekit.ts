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

export async function connectToRoom(token: string, url: string): Promise<import('livekit-client').Room> {
  ensureNativeLiveKitSupport()

  const [{ Room }, { AudioSession }] = await Promise.all([
    import('livekit-client'),
    import('@livekit/react-native'),
  ])

  await AudioSession.startAudioSession()

  const room = new Room({
    adaptiveStream: true,
    dynacast: true,
  })

  await room.connect(url, token)
  return room
}

export async function disconnectFromRoom(room: import('livekit-client').Room): Promise<void> {
  const [{ AudioSession }] = await Promise.all([
    import('@livekit/react-native'),
  ])
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
