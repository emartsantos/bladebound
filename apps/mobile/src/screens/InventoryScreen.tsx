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

const ITEM_NAMES: Record<string, string> = {
  iron_ore: 'Iron Ore',
  health_potion: 'Health Potion',
  maple_log: 'Maple Log',
  wolf_pelt: 'Wolf Pelt',
};

export function InventoryScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Inventory</Text>

        <Card>
          {MOCK_PLAYER.inventory.length === 0 ? (
            <Text style={styles.empty}>Inventory is empty.</Text>
          ) : (
            MOCK_PLAYER.inventory.map((item) => (
              <View key={item.itemId} style={styles.invRow}>
                <View style={styles.iconBox}>
                  <Text style={styles.iconText}>{ITEM_NAMES[item.itemId]?.[0] ?? '?'}</Text>
                </View>
                <Text style={styles.itemName}>
                  {ITEM_NAMES[item.itemId] ?? item.itemId}
                </Text>
                <Text style={styles.itemQty}>x{item.quantity}</Text>
              </View>
            ))
          )}
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Collections</Text>
          {Object.entries(MOCK_PLAYER.collections).map(([k, v]) => (
            <View key={k} style={styles.invRow}>
              <Text style={styles.itemName}>{k}</Text>
              <Text style={styles.itemQty}>{v} collected</Text>
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
  empty: { color: theme.colors.textMuted, fontSize: theme.fontSize.md },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.blackened,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: theme.colors.accentLight, fontSize: theme.fontSize.lg, fontWeight: '700' },
  itemName: { color: theme.colors.text, fontSize: theme.fontSize.md, flex: 1 },
  itemQty: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  cardTitle: { color: theme.colors.text, fontSize: theme.fontSize.lg, fontWeight: '700' },
});
