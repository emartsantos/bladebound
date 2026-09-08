import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { Card } from '../components/ui';
import { MOCK_PLAYER } from '../data/player';

const STAT_KEYS: Array<{ key: string; label: string }> = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'intelligence', label: 'Intellect' },
  { key: 'vitality', label: 'Vitality' },
  { key: 'critChance', label: 'Crit' },
  { key: 'attackSpeed', label: 'Speed' },
];

export function CharacterScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Character</Text>

        <Card>
          <Text style={styles.cardTitle}>{MOCK_PLAYER.name}</Text>
          <Text style={styles.meta}>Combat Level {MOCK_PLAYER.combatLevel}</Text>
          <View style={styles.statGrid}>
            {STAT_KEYS.map((s) => (
              <View key={s.key} style={styles.statCell}>
                <Text style={styles.statLabel}>{s.label}</Text>
                <Text style={styles.statValue}>{s.key === 'strength' ? 34 : s.key === 'agility' ? 28 : s.key === 'intelligence' ? 22 : s.key === 'vitality' ? 40 : 18}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Skills</Text>
          {Object.entries(MOCK_PLAYER.skills).map(([id, s]) => (
            <View key={id} style={styles.skillRow}>
              <Text style={styles.skillName}>{id}</Text>
              <Text style={styles.skillLevel}>Lv {s.level} · {s.xp.toLocaleString()} XP</Text>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Equipment</Text>
          {Object.entries(MOCK_PLAYER.equipment).map(([slot, e]) => (
            <View key={slot} style={styles.skillRow}>
              <Text style={styles.skillName}>{slot}</Text>
              <Text style={styles.skillLevel}>
                {e.itemId ?? '—'}{e.durability != null ? ` (${e.durability}%)` : ''}
              </Text>
            </View>
          ))}
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
  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '700' },
  meta: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, marginTop: 2 },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.md,
    rowGap: theme.spacing.sm,
  },
  statCell: {
    width: '33%',
    paddingVertical: theme.spacing.sm,
  },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs },
  statValue: { color: theme.colors.text, fontSize: theme.fontSize.md, fontWeight: '700' },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  skillName: { color: theme.colors.text, fontSize: theme.fontSize.md },
  skillLevel: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
});
