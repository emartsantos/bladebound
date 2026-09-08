import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Switch,
} from 'react-native';
import { theme } from '../theme';
import { Card } from '../components/ui';

export function MoreScreen() {
  const [sound, setSound] = React.useState(true);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>More</Text>

        <Card>
          <Text style={styles.cardTitle}>Settings</Text>
          <Row label="Sound" value={sound} onChange={setSound} />
          <Row label="Reduce Motion" value={reducedMotion} onChange={setReducedMotion} />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Game Info</Text>
          <Row label="Server" value={undefined} />
          <Text style={styles.mutedText}>emerald.and.iron · v0.1.0</Text>
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Support</Text>
          <Text style={styles.link}>Report a bug</Text>
          <Text style={styles.link}>FAQ</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value !== undefined && onChange && (
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: theme.colors.iron, true: theme.colors.accent }}
          thumbColor={theme.colors.bone}
        />
      )}
    </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: { color: theme.colors.text, fontSize: theme.fontSize.md },
  mutedText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, paddingBottom: theme.spacing.md },
  link: { color: theme.colors.accentLight, fontSize: theme.fontSize.md, paddingVertical: theme.spacing.sm },
});
