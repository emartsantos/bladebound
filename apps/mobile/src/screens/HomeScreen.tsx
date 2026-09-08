import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { Card, ResourceBar, BigButton } from '../components/ui';
import { MOCK_PLAYER, buildOfflineSummary } from '../data/player';

export function HomeScreen() {
  const [offlineHrs] = useState(3);
  const summary = buildOfflineSummary(offlineHrs * 3600000);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card>
          <Text style={styles.heading}>{MOCK_PLAYER.name}</Text>
          <Text style={styles.sub}>
            Level {MOCK_PLAYER.level} · {MOCK_PLAYER.region}
          </Text>
          <ResourceBar label="Health" value={920} max={1000} color={theme.colors.success} />
          <ResourceBar label="XP" value={MOCK_PLAYER.experience} max={20000} color={theme.colors.accent} />
          <Text style={styles.gold}>⛁ {MOCK_PLAYER.gold.toLocaleString()} gold</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionRow}>
            <BigButton title="Fight" style={styles.actionBtn} testID="quick-fight" />
            <BigButton title="Gather" variant="secondary" style={styles.actionBtn} testID="quick-gather" />
          </View>
          <BigButton title="Enter Dungeon" variant="secondary" style={{ marginTop: theme.spacing.md }} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Offline Summary</Text>
          <Text style={styles.offlineLine}>
            {offlineHrs}h away · {Math.round(summary.rewardMs / 60000)} min rewarded
          </Text>
          {summary.capped && (
            <Text style={styles.offlineCap}>Capped by policy (anti-exploit).</Text>
          )}
          <View style={styles.actionRow}>
            <BigButton title="Collect" style={styles.actionBtn} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  heading: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
  },
  sub: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
  gold: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.md,
    marginTop: theme.spacing.md,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionBtn: { flex: 1 },
  offlineLine: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.md,
    marginBottom: theme.spacing.sm,
  },
  offlineCap: {
    color: theme.colors.warning,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.md,
  },
});
