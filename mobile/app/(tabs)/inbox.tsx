import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { textStyles, theme } from '../../theme/voltage'

export default function InboxScreen(): React.ReactElement {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.kicker}>INBOX</Text>
        <Text style={styles.title}>Voltage inbox coming in step 3.</Text>
        <Text style={styles.body}>
          Notifications already exist in the app. This placeholder route is here so the new bottom nav can
          mount the full five-tab layout before the screen reskin work lands.
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  kicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  title: {
    ...textStyles.displayMD,
  },
  body: {
    ...textStyles.body,
    color: theme.color.muted,
  },
})
