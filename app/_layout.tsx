import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
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
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;
  useEffect(() => { setModelLoaded(true); }, [setModelLoaded]);
  return (
    <group position={[0, -0.5, 0]}>
      <Center>
        <primitive object={scene} scale={1.65} rotation={[0, -Math.PI / 2.5, 0]} />
      </Center>
    </group>
  );
}

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

  const [menuVisible, setMenuVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [isRefreshingToken, setIsRefreshingToken] = useState(false);

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
    Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });
    return () => linkingSubscription.remove();
  }, []);

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

  // 🌟 核心修复 1：在 scope 中加入官方指定的 user_data 和 standard OIDC scopes
  const handleTeslaOAuthLogin = async () => {
    const clientId = 'c4b90abb-d606-40e2-aa7a-2d7997dd584e'; 
    const redirectUri = 'https://dmitt.com/callback';
    // 强制索要 user_data 权限
    const scope = 'openid offline_access email profile user_data vehicle_device_data vehicle_cmds vehicle_charging_cmds';
    const state = Math.random().toString(36).substring(7);
    const authUrl = `https://auth.tesla.cn/oauth2/v3/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
    try { await Linking.openURL(authUrl); } catch (error) { Alert.alert('错误', '无法打开浏览器，请检查系统设置'); }
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
          setUserInfo(null); 
          setMenuVisible(false); 
          setVehicleName('请先登录特斯拉账号');
          setRange('---');
          setTemp('--');
        }
      }
    ]);
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

  // 🌟 核心修复 2：使用官方 JSON 文档里提供的 userinfo_endpoint 获取资料
  const fetchUserInfo = async (currentAccess: string) => {
    if (!currentAccess) return;
    setLoadingUser(true);
    try {
      // 访问正确的官方 Auth 接口
      const res = await fetch('https://auth.tesla.cn/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${currentAccess}` }
      });
      const data = await res.json();
      
      // 解析标准的 OIDC 格式返回数据
      if (res.ok) {
        setUserInfo({
          full_name: data.name || data.full_name || 'Tesla 车主',
          email: data.email || '已隐藏邮箱',
          // OIDC 标准头像是 picture 字段
          profile_image_url: data.picture || data.profile_image_url || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        });
      } else {
        setUserInfo({ 
          full_name: 'Tesla 车主', 
          email: data.error_description || data.error || '获取资料受限，请重新登录',
          profile_image_url: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        });
      }
    } catch (error) {
      setUserInfo({ full_name: 'Tesla 车主', email: '网络请求失败', profile_image_url: 'https://www.gravatar.com/avatar/0?d=mp' });
    } finally {
      setLoadingUser(false);
    }
  };

  const openMenu = () => {
    setMenuVisible(true);
    if (accessToken && !userInfo) {
      fetchUserInfo(accessToken);
    } else if (!accessToken) {
      setUserInfo({ full_name: '同步中...', email: '请稍后重试' });
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
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        Alert.alert('成功', '指令已发送');
        setTimeout(() => fetchCarData(), 2000);
      }
    } catch (error) { Alert.alert('指令发送失败', String(error)); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.imageContainer}>
          <Canvas style={styles.canvas} camera={{ position: [0, 1.5, 7], fov: 40 }}>
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 5]} intensity={2.5} color="white" />
            <directionalLight position={[-10, 0, 5]} intensity={1.5} color="white" />
            <directionalLight position={[0, 5, -10]} intensity={2.5} color="white" />
            <directionalLight position={[0, 10, 0]} intensity={1.5} color="white" />
            <Suspense fallback={null}>
              <Tesla3DModel setModelLoaded={setModelLoaded} />
            </Suspense>
            <OrbitControls enableZoom={false} enablePan={false} enableDamping={true} dampingFactor={0.08} rotateSpeed={1.2} minPolarAngle={Math.PI / 2.2} maxPolarAngle={Math.PI / 2.2} />
          </Canvas>
          {!modelLoaded && <View style={styles.FallbackLoaderContainer}><FallbackLoader /></View>}
          
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>已驻车</Text>
          </View>

          <TouchableOpacity style={styles.menuIconContainer} onPress={openMenu}>
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

      <Modal animationType="slide" transparent={true} visible={menuVisible} onRequestClose={() => setMenuVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>账号与设置</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {!refreshToken ? (
                <View style={styles.unauthView}>
                  <Ionicons name="person-circle-outline" size={80} color="#444" />
                  <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>
                  <TouchableOpacity style={styles.buttonAuthRed} onPress={() => { setMenuVisible(false); handleTeslaOAuthLogin(); }}>
                    <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <View style={styles.profileCard}>
                    {loadingUser ? (
                      <ActivityIndicator size="small" color="#fff" style={{ marginVertical: 20 }} />
                    ) : (
                      <>
                        <Image source={{ uri: userInfo?.profile_image_url || 'https://www.gravatar.com/avatar/0?d=mp' }} style={styles.avatar} />
                        <Text style={styles.userName}>{userInfo?.full_name || 'Tesla 车主'}</Text>
                        <Text style={styles.userEmail} numberOfLines={1}>{userInfo?.email || '获取邮箱中...'}</Text>
                      </>
                    )}
                  </View>
                  <View style={styles.settingsList}>
                    <View style={styles.settingItem}><Ionicons name="gift-outline" size={22} color="#fff" style={styles.settingIcon} /><View style={styles.settingTextContainer}><Text style={styles.settingTextPrimary}>引荐奖励</Text><Text style={styles.settingTextSecondary}>分享您的引荐链接获取积分</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></View>
                    <View style={styles.settingItem}><Ionicons name="car-sport-outline" size={22} color="#fff" style={styles.settingIcon} /><View style={styles.settingTextContainer}><Text style={styles.settingTextPrimary}>车辆管理</Text><Text style={styles.settingTextSecondary}>管理已绑定的设备与车辆</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></View>
                    <View style={styles.settingItem}><Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.settingIcon} /><View style={styles.settingTextContainer}><Text style={styles.settingTextPrimary}>隐私与安全</Text><Text style={styles.settingTextSecondary}>API 访问权限与数据管理</Text></View><Ionicons name="chevron-forward" size={20} color="#666" /></View>
                  </View>
                  <TouchableOpacity style={styles.logoutButton} onPress={handleResetToken}>
                    <Text style={styles.logoutButtonText}>退出登录</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  buttonAuthRed: { backgroundColor: '#E31937', paddingVertical: 16, width: '100%', borderRadius: 50, alignItems: 'center', marginTop: 10 },
  buttonTextWhiteLarge: { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  tokenSection: { borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 16, alignItems: 'center' },
  authDesc: { color: '#888', fontSize: 13, marginBottom: 12 },

  // Modal (个人中心) 样式
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  modalContent: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222', marginBottom: 10 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeButton: { padding: 4 },
  modalBody: { flex: 1 },
  unauthView: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  unauthText: { color: '#888', fontSize: 16, marginTop: 15, marginBottom: 30 },
  profileCard: { alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 20, paddingVertical: 30, marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 15, borderWidth: 2, borderColor: '#333' },
  userName: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  userEmail: { color: '#888', fontSize: 12, textAlign: 'center', paddingHorizontal: 10 },
  settingsList: { backgroundColor: '#1C1C1E', borderRadius: 16, marginBottom: 30 },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  settingIcon: { marginRight: 15 },
  settingTextContainer: { flex: 1 },
  settingTextPrimary: { color: '#fff', fontSize: 16, fontWeight: '500', marginBottom: 3 },
  settingTextSecondary: { color: '#888', fontSize: 12 },
  logoutButton: { backgroundColor: 'rgba(227, 25, 55, 0.1)', borderWidth: 1, borderColor: '#E31937', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 20 },
  logoutButtonText: { color: '#E31937', fontSize: 16, fontWeight: '600' },
});