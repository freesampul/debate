import React from 'react'
import { Link, Tabs } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { VBottomNav } from '../../components/voltage'
import { textStyles, theme } from '../../theme/voltage'

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      tabBar={(props) => <VBottomNav {...props} />}
      screenOptions={{
        sceneStyle: styles.scene,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTintColor: theme.color.ink,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (__DEV__ ? (
          <Link href="/components" asChild>
            <Pressable style={styles.devButton}>
              <Text style={styles.devButtonText}>DEV</Text>
            </Pressable>
          </Link>
        ) : null),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Rooms',
        }}
      />
      <Tabs.Screen
        name="questions"
        options={{
          title: 'Takes',
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: theme.color.bg,
  },
  header: {
    backgroundColor: theme.color.bg,
  },
  headerTitle: {
    ...textStyles.titleLG,
  },
  devButton: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.color.line,
    backgroundColor: theme.color.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  devButtonText: {
    fontFamily: theme.font.monoBold,
    fontSize: theme.type.tag.size,
    letterSpacing: theme.type.tag.letterSpacing,
    textTransform: 'uppercase',
    color: theme.color.ink,
  },
})
