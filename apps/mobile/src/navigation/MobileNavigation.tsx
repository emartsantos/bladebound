import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { theme } from './theme';
import { HomeScreen } from './screens/HomeScreen';
import { AdventureScreen } from './screens/AdventureScreen';
import { CharacterScreen } from './screens/CharacterScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { MoreScreen } from './screens/MoreScreen';

export type MobileTabParamList = {
  HomeTab: undefined;
  AdventureTab: undefined;
  CharacterTab: undefined;
  InventoryTab: undefined;
  MoreTab: undefined;
};

export type MobileStackParamList = {
  Main: undefined;
};

const Tab = createBottomTabNavigator<MobileTabParamList>();
const Stack = createNativeStackNavigator<MobileStackParamList>();

function TabBarIcon({ label }: { label: string }) {
  return <Text style={{ fontSize: 18 }}>{label}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTitleStyle: { color: theme.colors.text },
        headerTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.accentLight,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: theme.fontSize.xs },
        tabBarIcon: () => {
          const label = route.name.replace('Tab', '').toUpperCase();
          return <TabBarIcon label="" />;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home', tabBarIcon: () => <TabBarIcon label="H" /> }}
      />
      <Tab.Screen
        name="AdventureTab"
        component={AdventureScreen}
        options={{ title: 'Adventure', tabBarIcon: () => <TabBarIcon label="A" /> }}
      />
      <Tab.Screen
        name="CharacterTab"
        component={CharacterScreen}
        options={{ title: 'Character', tabBarIcon: () => <TabBarIcon label="C" /> }}
      />
      <Tab.Screen
        name="InventoryTab"
        component={InventoryScreen}
        options={{ title: 'Inventory', tabBarIcon: () => <TabBarIcon label="I" /> }}
      />
      <Tab.Screen
        name="MoreTab"
        component={MoreScreen}
        options={{ title: 'More', tabBarIcon: () => <TabBarIcon label="M" /> }}
      />
    </Tab.Navigator>
  );
}

export default function MobileNavigation() {
  return (
    <NavigationContainer theme={{
      dark: true,
      colors: {
        primary: theme.colors.accentLight,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
      fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '800' } },
    }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
