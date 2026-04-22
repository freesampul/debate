import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { Room } from '@debate-app/shared'
import {
  VBottomNav,
  VButton,
  VChatBubble,
  VLiveBadge,
  VMeter,
  VPill,
  VRoomCard,
  VSpeakerTile,
} from '../../components/voltage'
import { textStyles, theme } from '../../theme/voltage'

const SAMPLE_ROOM: Room = {
  id: 'room_voltage_preview',
  question_id: null,
  question_content: 'Can creators stay original once the algorithm rewards sameness?',
  title: 'Does the algorithm flatten taste?',
  topic: 'Originality versus optimization in creator culture.',
  status: 'live',
  host_id: 'pivot.host',
  livekit_room: null,
  recording_url: null,
  max_speakers: 8,
  created_at: new Date().toISOString(),
  ended_at: null,
}

export default function VoltageComponentsScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'index' | 'questions' | 'create' | 'inbox' | 'profile'>('index')

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Voltage / Components</Text>
        <Text style={styles.title}>Step 2 preview</Text>

        <Section title="Buttons">
          <View style={styles.row}>
            <VButton label="For" variant="pro" size="sm" />
            <VButton label="Against" variant="con" size="sm" />
          </View>
          <View style={styles.row}>
            <VButton label="Create room" variant="primary" />
            <VButton label="Ghost action" variant="ghost" />
          </View>
        </Section>

        <Section title="Pills + Live badge">
          <View style={styles.row}>
            <VPill label="LIVE NOW" bg={theme.color.surfaceAlt} />
            <VPill label="HOST" bg={theme.color.accent} fg={theme.color.conInk} border={theme.color.accent} />
            <VLiveBadge />
          </View>
        </Section>

        <Section title="Meters">
          <VMeter forPct={72} total={248} />
          <View style={styles.row}>
            <VMeter forPct={64} total={18} orientation="v" />
            <VMeter forPct={41} total={18} orientation="v" />
          </View>
        </Section>

        <Section title="Room card">
          <VRoomCard room={SAMPLE_ROOM} onPress={() => undefined} />
        </Section>

        <Section title="Chat bubbles">
          <VChatBubble userId="pro.speaker" text="You can dislike consensus without glorifying chaos." side="pro" isOwn={false} />
          <VChatBubble userId="con.speaker" text="That sounds elegant until moderation becomes censorship by vibe." side="con" isOwn={false} />
          <VChatBubble userId="me" text="The bar should move when evidence moves, not when volume does." side="pro" isOwn />
        </Section>

        <Section title="Speaker tiles">
          <View style={styles.row}>
            <VSpeakerTile name="maya.riffs" side="pro" speaking />
            <VSpeakerTile name="otto.drags" side="con" speaking={false} />
            <VSpeakerTile name="neutral.mod" side={null} speaking={false} />
          </View>
        </Section>

        <Section title="Bottom nav">
          <View style={styles.bottomNavPreview}>
            <VBottomNav activeKey={activeTab} onItemPress={setActiveTab} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({
  children,
  title,
}: React.PropsWithChildren<{ title: string }>): React.ReactElement {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.color.bg,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing['2xl'],
    gap: theme.spacing['2xl'],
  },
  kicker: {
    ...textStyles.label,
    color: theme.color.pro,
  },
  title: {
    ...textStyles.displayLG,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...textStyles.titleLG,
  },
  sectionBody: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  bottomNavPreview: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
})
