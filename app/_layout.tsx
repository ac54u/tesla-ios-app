import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert, // 🌟 新增：智能滚动容器
  Keyboard // 🌟 新增：手动控制键盘
  ,
  KeyboardAvoidingView, // 🌟 新增：处理键盘遮挡的核心组件
  Platform, // 🌟 新增：判断 iOS 还是 Android
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 1. 修复警告：使用最新的 SafeAreaView 替代 react-native 自带的
import { SafeAreaView } from 'react-native-safe-area-context';

// 引入 3D 渲染核心库
import { Center, OrbitControls, useGLTF } from '@react-three/drei/native';
import { Canvas } from '@react-three/fiber/native';

// --- 3D 车辆组件（完美比例，防跑偏居中）---
interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;

  useEffect(() => {
    setModelLoaded(true);
  }, [setModelLoaded]);

  return (
    <group position={[0, -0.5, 0]}>
      {/* Center 组件强制修正模型的物理中心，保证旋转时绝对在原地打转 */}
      <Center>
        <primitive 
          object={scene} 
          scale={1.4}                     
          rotation={[0, Math.PI / 1.2, 0]} 
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
  
  // 动态车辆名称状态
  const [vehicleName, setVehicleName] = useState('车辆连接中...');
  const [range, setRange] = useState('---');
  const [temp, setTemp] = useState('--');
  const [locationText, setLocationText] = useState('定位获取中...');
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('teslaRefreshToken');
      if (savedToken) {
        setRefreshToken(savedToken);
        // 如果有缓存的 Token，启动时自动尝试获取一次数据
        setTimeout(() => fetchCarData(savedToken), 500); 
      } else {
        setVehicleName('请先配置 Token');
      }
    };
    loadToken();
  }, []);

  const handleSaveAndRefresh = async () => {
    if (!refreshToken.trim()) {
      Alert.alert('提示', '请先输入 Refresh Token');
      return;
    }
    // 🌟 保存成功后，主动收起键盘
    Keyboard.dismiss();
    await AsyncStorage.setItem('teslaRefreshToken', refreshToken);
    Alert.alert('成功', 'Token 已保存！正在尝试连接车辆...');
    fetchAccessToken(refreshToken);
  };

  // 长按车名清除 Token 的隐藏功能
  const handleResetToken = () => {
    Alert.alert('重置授权', '确定要清除当前 Token 重新配置吗？', [
      { text: '取消', style: 'cancel' },
      { 
        text: '清除', 
        style: 'destructive', 
        onPress: async () => {
          await AsyncStorage.removeItem('teslaRefreshToken');
          setRefreshToken('');
          setAccessToken('');
          setVehicleId('');
          setVehicleName('请先配置 Token');
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
          client_id: 'ownerapi'
        })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        return data.access_token;
      } else {
        Alert.alert('错误', 'Token 已失效，请长按车名重置并重新输入');
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
      
      if (vehicle.display_name) {
        setVehicleName(vehicle.display_name);
      } else {
        setVehicleName('我的特斯拉');
      }

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
      
      {/* 🌟 核心修复 1：使用 KeyboardAvoidingView 包裹全屏，智能响应键盘高度 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        {/* 顶部 3D 渲染区 */}
        <View style={styles.imageContainer}>
          <Canvas 
            style={styles.canvas}
            camera={{ position: [0, 1.5, 7], fov: 40 }}
          >
            <color attach="background" args={['#000000']} />
            <ambientLight intensity={1.2} />
            <directionalLight position={[10, 10, 5]} intensity={2.5} color="white" />
            <directionalLight position={[-10, 0, 5]} intensity={1.5} color="white" />
            
            <Suspense fallback={null}>
              <Tesla3DModel setModelLoaded={setModelLoaded} />
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              enableDamping={true}
              dampingFactor={0.08}
              rotateSpeed={1.2}
              minPolarAngle={Math.PI / 2.2} 
              maxPolarAngle={Math.PI / 2.2}
            />
          </Canvas>

          {!modelLoaded && (
            <View style={styles.FallbackLoaderContainer}>
              <FallbackLoader />
            </View>
          )}

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>已驻车</Text>
          </View>
        </View>

        {/* 🌟 核心修复 2：将底面板替换为智能 ScrollView
            - bounces={false} 禁用弹性，平时绝对滑不动
            - contentContainerStyle 控制内容排版
            - keyboardShouldPersistTaps="handled" 保证点其他地方能顺畅收起键盘 
        */}
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentContainer}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          
          {/* 头部信息区 */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              activeOpacity={0.6} 
              onPress={() => fetchCarData()} 
              onLongPress={handleResetToken}
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

          {/* 温度与位置区 */}
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

          {/* 控制按钮区 */}
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

          {/* Token 输入区 */}
          {!refreshToken && (
            <View style={styles.tokenSection}>
              <TextInput
                style={styles.input}
                placeholder="初次使用，请粘贴 Refresh Token"
                placeholderTextColor="#888"
                value={refreshToken}
                onChangeText={setRefreshToken}
                secureTextEntry={true}
                // 🌟 新增：用户在键盘点“完成/回车”时，也能自动收起键盘并保存
                returnKeyType="done"
                onSubmitEditing={handleSaveAndRefresh}
              />
              <TouchableOpacity style={styles.buttonWhite} onPress={handleSaveAndRefresh}>
                <Text style={styles.buttonTextDark}>💾 验证并连接车辆</Text>
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
  
  // 🌟 核心修复 3：将原本 view 的样式迁移到 ScrollView 的 contentContainer 里面
  // flexGrow: 1 会让内容自动撑满屏幕，平时没有滚动条，绝对滑不动。
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
  buttonWhite: { backgroundColor: '#fff', paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  buttonTextDark: { color: '#000', fontSize: 16, fontWeight: '600' },
  
  tokenSection: { borderTopWidth: 1, borderTopColor: '#2C2C2E', paddingTop: 16 },
  input: { backgroundColor: '#1C1C1E', color: '#fff', padding: 14, borderRadius: 14, fontSize: 14, marginBottom: 10 },
});