import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DashboardScreen from '../screens/DashboardScreen';
import EditSaleScreen from '../screens/EditSaleScreen';
import { colors, typography } from '../theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: ['home', 'home-outline'],
  History: ['time', 'time-outline'],
  Dashboard: ['stats-chart', 'stats-chart-outline'],
};

function tabIcon(routeName) {
  return ({ focused, color, size }) => {
    const [on, off] = TAB_ICONS[routeName] ?? ['ellipse', 'ellipse-outline'];
    return <Ionicons name={focused ? on : off} size={size} color={color} />;
  };
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: typography.small,
          fontWeight: '700',
        },
        tabBarStyle: {
          backgroundColor: colors.card,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: tabIcon('Home') }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ tabBarIcon: tabIcon('History') }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: tabIcon('Dashboard') }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="EditSale"
        component={EditSaleScreen}
        options={{ presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
}
