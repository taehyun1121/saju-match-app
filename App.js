import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './screens/OnboardingScreen';
import MyProfileScreen from './screens/MyProfileScreen';
import CompatibilityScreen from './screens/CompatibilityScreen';
import MatchScreen from './screens/MatchScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const STACK_OPTS = {
  headerStyle: { backgroundColor: '#0d0d1a' },
  headerTintColor: '#a78bfa',
  headerTitleStyle: { fontWeight: '700' },
  contentStyle: { backgroundColor: '#0d0d1a' },
};

function SajuStack() {
  return (
    <Stack.Navigator screenOptions={STACK_OPTS}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ title: '내 사주' }} />
      <Stack.Screen name="Compatibility" component={CompatibilityScreen} options={{ title: '궁합 테스트' }} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0d0d1a',
            borderTopColor: '#2d2d4e',
            height: 64,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#a78bfa',
          tabBarInactiveTintColor: '#4a4a6a',
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tab.Screen
          name="사주"
          component={SajuStack}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>☯</Text>,
          }}
        />
        <Tab.Screen
          name="매칭"
          component={MatchScreen}
          options={{
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💜</Text>,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </SafeAreaProvider>
  );
}
