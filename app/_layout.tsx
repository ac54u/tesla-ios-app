import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { Center, OrbitControls, useGLTF } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- 3D 车辆组件 ---
interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  // 使用 GITHUB 上的托管模型
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;

  useEffect(() => {
    setModelLoaded(true);
  }, [setModelLoaded]);

  return (
    <group position={[0, -0.5, 0]}>
      <Center>
        <primitive 
          object={scene} 
          scale={1.65}                     
          rotation={[0, -Math.PI / 2.5, 0]} 
        />
      </Center>
    </group>
  );
}

// 占位加载动画
function FallbackLoader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={{ color: '#888', marginTop: 10 }}>模型解析中...</Text>
    </View>
  );
}

export default function App() {
  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  
  const [vehicleName, setVehicleName] = useState('车辆连接中...');
  const [range, setRange] = useState('---');
  const [temp, setTemp] = useState('--');
  const [locationText, setLocationText] = useState('定位获取中...');
  const [modelLoaded, setModelLoaded] = useState(false);

  // 1. 监听来自服务器端传回的 Deep Link
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url && url.includes('refresh_token=')) {
        const tokenMatch = url.match(/refresh_token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const newToken = tokenMatch[1];
          setRefreshToken(newToken);
          await AsyncStorage.setItem('teslaRefreshToken', newToken);
          Alert.alert('登录成功', '正在获取车辆数据...');
          fetchCarData(newToken);
        }
      }
    };

    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);
    
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      linkingSubscription.remove();
    };
  }, []);

  // 2. 初始化加载本地 Token
  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('teslaRefreshToken');
      if (savedToken) {
        setRefreshToken(savedToken);
        setTimeout(() => fetchCarData(savedToken), 500); 
      } else {
        setVehicleName('请先登录特斯拉账号');
      }
    };
    loadToken();
  }, []);

  // 触发 OAuth 2.0 登录流程
  const handleTeslaOAuthLogin = async () => {
    const clientId = 'c4b90abb-d606-40e2-aa7a-2d7997dd584e'; 
    const redirectUri = 'https://dmitt.com/callback';
    const scope = 'openid offline_access vehicle_device_data vehicle_cmds vehicle_charging_cmds';
    const state = Math.random().toString(36).substring(7);

    const authUrl = `https://auth.tesla.cn/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    try {
      await Linking.openURL(authUrl);
    } catch (error) {
      Alert.alert('错误', '无法打开浏览器，请检查系统设置');
    }
  };

  const handleResetToken = () => {
    Alert.alert('退出登录', '确定要退出当前账号并清除数据吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '退出', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.removeItem('teslaRefreshToken');
          setRefreshToken('');
          setAccessToken('');
          setVehicleId('');
          setVehicleName('请先登录特斯拉账号');
          setRange('---');
          setTemp('--');
        }
      }
    ]);
  };

  const fetchAccessToken = async (currentToken = refreshToken) => {
    if (!currentToken) return null;
    try {
      const res = await fetch('https://auth.tesla.cn/oauth2/v3/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: currentToken,
          client_id: 'c4b90abb-d606-40e2-aa7a-2d7997dd584e' 
        })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        return data.access_token;
      } else {
        Alert.alert('错误', 'Token 已失效，请重新登录');
        handleResetToken();
        return null;
      }
    } catch (error) {
      console.error('获取 Access Token 失败:', error);
      return null;
    }
  };

  const fetchCarData = async (tokenToUse = refreshToken) => {
    let currentAccess = accessToken;
    if (!currentAccess) {
      currentAccess = await fetchAccessToken(tokenToUse);
      if (!currentAccess) return;
    }

    try {
      const vRes = await fetch('https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles', {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });
      const vData = await vRes.json();
      const vehicle = vData.response?.[0];
      
      if (!vehicle) {
        setVehicleName('未找到名下车辆');
        return;
      }
      
      setVehicleId(vehicle.id);
      setVehicleName(vehicle.display_name || '我的特斯拉');

      const dataRes = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vehicle.id}/vehicle_data`, {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });
      const carData = await dataRes.json();
      
      const chargeState = carData.response?.charge_state;
      const climateState = carData.response?.climate_state;
      const driveState = carData.response?.drive_state;
      
      if (chargeState?.battery_range) setRange(Math.round(chargeState.battery_range).toString());
      if (climateState?.inside_temp) setTemp(climateState.inside_temp.toFixed(1));
      if (driveState) setLocationText('已更新最新位置');

    } catch (error) {
      console.error('获取车辆数据失败:', error);
    }
  };

  const sendCommand = async (endpoint: string, body: Record<string, any> = {}) => {
    if (!vehicleId || !accessToken) {
      Alert.alert('提示', '车辆尚未连接，请稍后再试');
      return;
    }
    try {
      const res = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vehicleId}/command/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        Alert.alert('成功', '指令已发送');
        setTimeout(() => fetchCarData(), 2000);
      }
    } catch (error) {
      Alert.alert('指令发送失败', String(error));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* 3D 车辆展示区 */}
        <View style={styles.imageContainer}>
          <Canvas style={styles.canvas} camera={{ position: [0, 1.5, 7], fov: 40 }}>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={2.5} color="white" />
            <directionalLight position={[-10, 0, 5]} intensity={1.5} color="white" />
            <Suspense fallback={null}>
              <Tesla3DModel setModelLoaded={setModelLoaded} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} enableDamping={true} dampingFactor={0.08} rotateSpeed={1.2} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} />
          </Canvas>
          {!modelLoaded && <View style={styles.FallbackLoaderContainer}><FallbackLoader /></View>}
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>已驻车</Text>
          </View>

          {/* 右上角菜单按钮 */}
          <TouchableOpacity 
            style={styles.menuIconContainer} 
            onPress={() => Alert.alert('菜单', '设置和更多功能即将开放！')}
          >
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 车辆信息与控制区 */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer} bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={() => refreshToken ? fetchCarData() : undefined} 
              onLongPress={refreshToken ? handleResetToken : undefined}
              disabled={!refreshToken}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.title}>{vehicleName}</Text>
                {vehicleId ? <Text style={styles.refreshIcon}> 🔄</Text> : null}
              </View>
            </TouchableOpacity>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rangeText}>{range} km</Text>
              <Text style={styles.subText}>剩余续航</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <Text style={styles.tempText}>{temp}°C</Text>
              <Text style={styles.subText}>车内温度</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.locationText}>{locationText}</Text>
              <Text style={styles.subText}>当前位置</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('door_lock')}>
              <Text style={styles.buttonText}>🔒 锁车</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('climate_on', { temperature: 16 })}>
              <Text style={styles.buttonText}>❄️ 预冷到16°C</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('set_sentry_mode', { on: true })}>
              <Text style={styles.buttonText}>👁️ 开哨兵模式</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonGreen} onPress={() => sendCommand('charge_start')}>
              <Text style={styles.buttonText}>⚡ 开始充电</Text>
            </TouchableOpacity>
          </View>

          {/* 登录部分 */}
          {!refreshToken && (
            <View style={styles.tokenSection}>
              <Text style={styles.authDesc}>绑定你的特斯拉账号以安全控制车辆</Text>
              <TouchableOpacity style={styles.buttonAuthRed} onPress={handleTeslaOAuthLogin}>
                <Text style={styles.buttonTextWhiteLarge}>登录 Tesla 账号</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageContainer: { height: 260, backgroundColor: '#000', position: 'relative' },
  canvas: { ...StyleSheet.absoluteFillObject },
  FallbackLoaderContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1 }, 
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
  statusBadge: { position: 'absolute', top: 16, left: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, zIndex: 10 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  menuIconContainer: { position: 'absolute', top: 12, right: 16, zIndex: 10, padding: 8 },
  contentContainer: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16, justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  refreshIcon: { fontSize: 14, opacity: 0.6 },
  rangeText: { fontSize: 22, fontFamily: 'Courier', color: '#fff' },
  subText: { fontSize: 12, color: '#888', marginTop: 4 },
  infoGrid: { flexDirection: 'row' },
  infoCol: { flex: 1, alignItems: 'center' },
  tempText: { fontSize: 32, fontFamily: 'Courier', color: '#fff' },
  locationText: { fontSize: 16, color: '#fff', paddingBottom: 6 },
  controls: { gap: 10 },
  buttonDark: { backgroundColor: '#1C1C1E', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonGreen: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  // 核心样式：基础按钮文字
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  // 核心样式：红色登录按钮 (无光晕)
  buttonAuthRed: { 
    backgroundColor: '#E31937', 
    paddingVertical: 16, 
    width: '100%',
    borderRadius: 50, 
    alignItems: 'center', 
    marginTop: 10,
  },
  // 核心样式：红色登录按钮大号文字
  buttonTextWhiteLarge: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  tokenSection: { borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 16, alignItems: 'center' },
  authDesc: { color: '#888', fontSize: 13, marginBottom: 12 },
});
