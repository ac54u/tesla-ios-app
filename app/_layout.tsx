// app/_layout.tsx
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';

export default function RootLayout() {
  // 🌟 终极核心：直接修改 React Navigation 的原生深色主题，把死黑背景替换成护眼深灰
  const customTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#131314', // 这一句，价值千金，彻底抹杀所有黑边
    },
  };

  return (
    <ThemeProvider value={customTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#131314' } }} />
    </ThemeProvider>
  );
}
