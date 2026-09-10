import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Splash } from './src/components/Splash';
import { initDatabase } from './src/db/database';
import { useAutoSync } from './src/hooks/useAutoSync';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

/** Auto-sync triggers only become active once the database is ready. */
function AutoSync() {
  useAutoSync();
  return null;
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDatabase()
      .catch((err) => {
        console.error('[db] init failed:', err);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <AutoSync />
    </SafeAreaProvider>
  );
}
