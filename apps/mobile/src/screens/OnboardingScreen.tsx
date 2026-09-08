import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Animated,
  View as RVView,
} from 'react-native';
import { theme } from '../theme';
import { BigButton, Card } from '../components/ui';
import { ONBOARDING_STEPS } from '../data/onboarding';

type OnboardingComplete = () => void;

export function OnboardingScreen({
  onComplete,
}: {
  onComplete: OnboardingComplete;
}) {
  const [step, setStep] = useState(0);
  const [animated] = useState(() => new Animated.Value(0));

  useEffect(() => {
    // Simple fade-in animation for each step
    if (step < ONBOARDING_STEPS.length - 1) {
      Animated.parallel([
        animated.opacity(1),
        animated.translateY(-10),
      ]).start();
    }
  }, [step]);

  const current = ONBOARDING_STEPS[step];

  const nextStep = () => {
    if (step < ONBOARDING_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{current.title}</Text>

        <Card style={styles.card}>
          <Text style={styles.body}>{current.body}</Text>
        </Card>

        <RVView
          style={[
            styles.imageBox,
            { backgroundColor: theme.colors[current.colorKey] },
          ]}
        />

        <BigButton
          title={current.cta}
          variant="primary"
          style={{ marginTop: theme.spacing.lg }}
          onPress={nextStep}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  title: {
    color: theme.colors.text,
    fontSize: theme.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  body: {
    color: theme.colors.textMuted,
    fontSize: theme.fontSize.md,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  imageBox: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    borderRadius: 40,
    marginBottom: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});