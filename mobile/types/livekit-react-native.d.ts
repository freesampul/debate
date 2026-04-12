declare module '@livekit/react-native' {
  import type React from 'react'
  import type { StyleProp, ViewStyle } from 'react-native'

  export interface VideoViewProps {
    style?: StyleProp<ViewStyle>
    trackSid: string
  }
  export const VideoView: React.ComponentType<VideoViewProps>

  export const AudioSession: {
    startAudioSession(): Promise<void>
    stopAudioSession(): Promise<void>
  }
}
