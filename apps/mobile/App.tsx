import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MobileNavigation from './src/navigation/MobileNavigation';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

let hasInitialized = false;

export default function App() {
  if (!hasInitialized) {
    // Simple init - mark as initialized immediately
    // In a real app, this would load fonts, etc.
    hasInitialized = true;
  }

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@onboarding_completed')
      .then((val) => {
        setHasCompletedOnboarding(val === 'true');
      })
      .catch(() => setHasCompletedOnboarding(false));
  }, []);

  return (
    <SafeAreaProvider>
      {hasCompletedOnboarding ? (
        <MobileNavigation />
      ) : (
        <OnboardingScreen onComplete={() => {
          AsyncStorage.setItem('@onboarding_completed', 'true');
          setHasCompletedOnboarding(true);
        }} />
      )}
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}