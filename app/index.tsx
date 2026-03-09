// app/index.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OrbitControls } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';
import { Audio } from 'expo-av';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { Suspense, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal, // 🌟 确保引入了 Modal
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SettingsMenu from './SettingsMenu';
import Tesla3DModel, { FallbackLoader, HudOverlay } from './Tesla3DModel';
// 🌟 引入刚刚写好的充电地图组件
import ChargingMap from './ChargingMap';

export default function Layout() {
  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  
  const [vehicleName, setVehicleName] = useState('车辆连接中...');
  const [range, setRange] = useState('---');
  const [temp, setTemp] = useState('--');
  const [locationText, setLocationText] = useState('定位获取中...');
  const [modelLoaded, setModelLoaded] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  // 🌟 新增：控制充电地图显示/隐藏的开关
  const [mapVisible, setMapVisible] = useState(false);
  
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

  const [frunkOpen, setFrunkOpen] = useState(false);
  const [trunkOpen, setTrunkOpen] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [chargePortOpen, setChargePortOpen] = useState(false);

  const [accountName, setAccountName] = useState('获取中...');
  const [accountAvatar, setAccountAvatar] = useState('');
  const [accountEmail, setAccountEmail] = useState('已绑定官方账号');

  const playLockSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/lock.wav')
      );
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) sound.unloadAsync();
      });
    } catch (error) {
      console.log('播放音效失败:', error);
    }
  };

  const fetchAccessToken = async (currentToken = refreshToken) => {
    if (!currentToken) return null;
    if (isRefreshingToken) return null; 
    
    setIsRefreshingToken(true);
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
        setIsRefreshingToken(false);
        return data.access_token;
      } else {
        console.error('Token 刷新失败', data);
        setIsRefreshingToken(false);
        return null;
      }
    } catch (error) {
      console.error('获取 Access Token 失败:', error);
      setIsRefreshingToken(false);
      return null;
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const res = await fetch('https://auth.tesla.cn/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const user = await res.json();
        if (user) {
          setAccountName(user.name || user.preferred_username || 'Tesla 车主');
          setAccountAvatar(user.picture || '');
          setAccountEmail(user.email || '已绑定官方账号');
        }
      }
    } catch (error) {
      console.error('获取车主身份信息失败:', error);
    }
  };

  const fetchCarData = async (tokenToUse = refreshToken, isRetry = false) => {
    let currentAccess = accessToken;
    if (!currentAccess) {
      currentAccess = await fetchAccessToken(tokenToUse);
      if (!currentAccess) return;
    }

    fetchUserProfile(currentAccess);

    try {
      const vRes = await fetch('https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles', {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });

      if (vRes.status === 401 && !isRetry) {
        const newAccess = await fetchAccessToken(refreshToken);
        if (newAccess) return fetchCarData(refreshToken, true);
        return;
      }

      const vData = await vRes.json();
      const vehicle = vData.response?.[0];
      
      if (!vehicle) {
        setVehicleName('未找到名下车辆');
        return;
      }
      
      setVehicleId(vehicle.id_s);
      setVehicleName(vehicle.display_name || '我的特斯拉');

      const dataRes = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vehicle.id_s}/vehicle_data`, {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });
      const carData = await dataRes.json();
      
      const chargeState = carData.response?.charge_state;
      const climateState = carData.response?.climate_state;
      const driveState = carData.response?.drive_state;
      const vehicleState = carData.response?.vehicle_state; 
      
      if (chargeState) {
        setRange(Math.round(chargeState.battery_range).toString());
        setChargePortOpen(chargeState.charge_port_door_open);
      }
      if (climateState?.inside_temp) setTemp(climateState.inside_temp.toFixed(1));
      if (driveState) setLocationText('已更新最新位置');

      if (vehicleState) {
        setFrunkOpen(vehicleState.ft > 0); 
        setTrunkOpen(vehicleState.rt > 0); 
        setIsLocked(vehicleState.locked);
      }
    } catch (error) {
      console.error('获取车辆数据失败:', error);
    }
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      if (url && url.includes('refresh_token=')) {
        WebBrowser.dismissBrowser();
        const tokenMatch = url.match(/refresh_token=([^&]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const newToken = tokenMatch[1];
          setRefreshToken(newToken);
          setMenuVisible(false);
          await AsyncStorage.setItem('teslaRefreshToken', newToken);
          fetchCarData(newToken);
        }
      }
    };
    const linkingSubscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    return () => linkingSubscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('teslaRefreshToken');
      if (savedToken) {
        setRefreshToken(savedToken);
        setTimeout(() => fetchCarData(savedToken), 500); 
      } else {
        setVehicleName('请先登录特斯拉账号');
        setAccountName('未登录');
        setAccountEmail('');
      }
    };
    loadToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTeslaOAuthLogin = async () => {
    const clientId = 'c4b90abb-d606-40e2-aa7a-2d7997dd584e'; 
    const redirectUri = 'https://dmitt.com/callback';
    const scope = 'openid offline_access email profile user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds';
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://auth.tesla.cn/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}&prompt=login`;
    
    try { 
      await WebBrowser.openBrowserAsync(authUrl); 
    } catch (error) { 
      Alert.alert('错误', '无法打开登录页面'); 
    }
  };

  const handleResetToken = () => {
    Alert.alert('退出登录', '确定要退出当前账号并清除所有本地缓存吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '退出', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.clear();
          
          setRefreshToken('');
          setAccessToken('');
          setVehicleId('');
          setMenuVisible(false); 
          
          setVehicleName('请先登录特斯拉账号');
          setRange('---');
          setTemp('--');
          setLocationText('定位获取中...');
          
          setAccountName('未登录');
          setAccountAvatar('');
          setAccountEmail('');

          setFrunkOpen(false);
          setTrunkOpen(false);
          setIsLocked(true);
          setChargePortOpen(false);
        }
      }
    ]);
  };

  const sendCommand = async (endpoint: string, body: Record<string, any> = {}, isRetry = false) => {
    if (!vehicleId || !accessToken) {
      Alert.alert('提示', '车辆尚未连接，请稍后再试');
      return;
    }
    try {
      const res = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vehicleId}/command/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.status === 401 && !isRetry) {
        const newAccess = await fetchAccessToken(refreshToken);
        if (newAccess) return sendCommand(endpoint, body, true);
      }

      if (res.ok) {
        if (endpoint === 'door_lock') playLockSound();
        Alert.alert('成功', '指令已发送');
        setTimeout(() => fetchCarData(), 2000); 
      } else {
        Alert.alert('指令失败', `状态码: ${res.status}`);
      }
    } catch (error) { Alert.alert('指令发送失败', String(error)); }
  };

  return (
    // 🌟 顶层背景修改为 #111111
    <View style={{ flex: 1, backgroundColor: '#111111' }}>
      <StatusBar style="light" />

      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.imageContainer}>
            <Canvas style={styles.canvas} camera={{ position: [0, 1.5, 7], fov: 40, near: 0.1, far: 100 }}>
              {/* 🌟 3D 画布的背景颜色修改为 #111111 */}
              <color attach="background" args={['#111111']} />
              <ambientLight intensity={1.5} />
              <directionalLight position={[10, 10, 5]} intensity={2.5} color="white" />
              <directionalLight position={[-10, 0, 5]} intensity={1.5} color="white" />
              <directionalLight position={[0, 5, -10]} intensity={2.5} color="white" />
              <directionalLight position={[0, 10, 0]} intensity={1.5} color="white" />
              <Suspense fallback={null}>
                <Tesla3DModel 
                  setModelLoaded={setModelLoaded} 
                  showControls={!!refreshToken} 
                />
              </Suspense>
              
              {modelLoaded && (
                <OrbitControls 
                  makeDefault 
                  enableZoom={false} 
                  enablePan={false} 
                  enableDamping={true} 
                  dampingFactor={0.06} 
                  rotateSpeed={0.8}
                  minPolarAngle={Math.PI / 2.5} 
                  maxPolarAngle={Math.PI / 2.2} 
                />
              )}
            </Canvas>

            {!modelLoaded && <View style={styles.FallbackLoaderContainer}><FallbackLoader /></View>}
            
            {!!refreshToken && (
              <HudOverlay 
                labels={{
                  frunk: frunkOpen ? '关闭前备箱' : '打开前备箱',
                  trunk: trunkOpen ? '关闭后备箱' : '打开后备箱',
                  door: isLocked ? '解锁车门' : '🔒 锁车',
                  charge: chargePortOpen ? '关闭充电口' : '⚡ 充电口'
                }}
                actions={{
                  frunk: () => sendCommand('actuate_trunk', { which_trunk: 'front' }),
                  trunk: () => sendCommand('actuate_trunk', { which_trunk: 'rear' }),
                  door: () => sendCommand(isLocked ? 'door_unlock' : 'door_lock'),
                  charge: () => sendCommand(chargePortOpen ? 'charge_port_door_close' : 'charge_port_door_open'),
                }} 
              />
            )}

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isLocked ? '已驻车' : '车辆已解锁'}
              </Text>
            </View>

            <TouchableOpacity style={styles.menuIconContainer} onPress={() => setMenuVisible(true)}>
              <Ionicons name="menu" size={26} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.contentContainer} bounces={false} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <TouchableOpacity activeOpacity={0.6} onPress={() => refreshToken ? fetchCarData() : undefined} disabled={!refreshToken}>
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
              <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('door_lock')}><Text style={styles.buttonText}>🔒 锁车</Text></TouchableOpacity>
              <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('climate_on', { temperature: 16 })}><Text style={styles.buttonText}>❄️ 预冷到16°C</Text></TouchableOpacity>
              <TouchableOpacity style={styles.buttonDark} onPress={() => sendCommand('set_sentry_mode', { on: true })}><Text style={styles.buttonText}>👁️ 开哨兵模式</Text></TouchableOpacity>
              <TouchableOpacity style={styles.buttonGreen} onPress={() => sendCommand('charge_start')}><Text style={styles.buttonText}>⚡ 开始充电</Text></TouchableOpacity>
            </View>

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

        {/* 侧边菜单 */}
        <SettingsMenu
          visible={menuVisible}
          onClose={() => setMenuVisible(false)}
          refreshToken={refreshToken}
          accessToken={accessToken}
          vehicleId={vehicleId}
          accountName={accountName}
          accountAvatar={accountAvatar}
          accountEmail={accountEmail}
          onLogin={() => { 
            handleTeslaOAuthLogin();
          }}
          onLogout={handleResetToken}
          onOpenMap={() => {
            setMenuVisible(false);
            setTimeout(() => setMapVisible(true), 300);
          }}
        />

        {/* 🌟 挂载全局地图弹窗组件 */}
        <Modal
          visible={mapVisible}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          onRequestClose={() => setMapVisible(false)}
        >
          <ChargingMap onClose={() => setMapVisible(false)} />
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🌟 主容器背景修改为 #111111
  container: { flex: 1, backgroundColor: '#111111' },
  // 🌟 图片区域背景修改为 #111111
  imageContainer: { height: 260, backgroundColor: '#111111', position: 'relative' },
  canvas: { ...StyleSheet.absoluteFillObject },
  FallbackLoaderContainer: { ...StyleSheet.absoluteFillObject, zIndex: -1 }, 
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  buttonAuthRed: { backgroundColor: '#E31937', paddingVertical: 16, width: '100%', borderRadius: 50, alignItems: 'center', marginTop: 10 },
  // 🌟 分割线颜色降低亮度，匹配 SettingsMenu 的暗纹风格
  tokenSection: { borderTopWidth: 1, borderTopColor: '#262626', paddingTop: 16, alignItems: 'center' },
  authDesc: { color: '#888', fontSize: 13, marginBottom: 12 },
});
