import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import { Card, BigButton } from '../components/ui';
import { buildRegionsDisplay } from '../data/regions';
import { MOCK_PLAYER } from '../data/player';
import type { Region } from '@premium-rpg/game-data';

export function AdventureScreen() {
  const [selectedRegion, setSelectedRegion] = useState<Region['id'] | null>(
    'starter-frontier'
  );

  const displayedRegions = buildRegionsDisplay();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Adventure</Text>

        {displayedRegions.map((r) => (
          <Card key={r.id} style={styles.regionCard}>
            <View style={styles.regionHeader}>
              <Text style={styles.regionName}>{r.name}</Text>
              {r.unlocked ? (
                <Text style={styles.badgeUnlocked}>Unlocked</Text>
              ) : (
                <Text style={styles.badgeLocked}>Locked</Text>
              )}
            </View>
            <Text style={styles.regionMeta}>
              {r.enemyCount} enemies · Lv {r.recommendedLevel}
            </Text>
            {r.unlocked && (
              <BigButton
                title={selectedRegion === r.id ? '✓ Traveling here' : 'Travel'}
                variant={selectedRegion === r.id ? 'secondary' : 'primary'}
                style={{ marginTop: theme.spacing.md }}
                onPress={() => {
                  setSelectedRegion(r.id);
                  Alert.alert('Travel', `Arrived at ${r.name}.`);
                }}
              />
            )}
          </Card>
        ))}

        <Card>
          <Text style={styles.cardTitle}>Dungeons</Text>
          {Object.entries(MOCK_PLAYER.dungeonProgress).map(([id, d]) => (
            <View key={id} style={styles.dungeonRow}>
              <Text style={{ color: theme.colors.text }}>{id}</Text>
              <Text style={{ color: theme.colors.textMuted }}>
                {d.completions} clears
              </Text>
            </View>
          ))}
          <BigButton title="Enter Gloomvault" style={{ marginTop: theme.spacing.md }} />
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
  regionCard: { gap: theme.spacing.sm },
  regionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  regionName: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '700' },
  badgeUnlocked: { color: theme.colors.success, fontSize: theme.fontSize.sm },
  badgeLocked: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  regionMeta: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    marginBottom: theme.spacing.sm,
  },
  dungeonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xs,
  },
});