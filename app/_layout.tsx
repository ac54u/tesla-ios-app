import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { Suspense, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Canvas } from '@react-three/fiber/native';
// 移除了 Environment，避免网络请求
import { OrbitControls, useGLTF } from '@react-three/drei/native';
// 🌟 引入 three.js 用于在代码中手动创建光束几何体
import * as THREE from 'three';

// --- 3D 车辆组件（更新为侧视图，并添加体积光束）---
function Tesla3DModel() {
  // 使用加速后的专属网络直链
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;

  // 🌟 精确调整为侧面视角（车头朝左）
  return (
    <primitive 
      object={scene} 
      scale={1.65}                    // + 更大，更有冲击力
      position={[0, -1.05, 0]}       // + 完全居中
      rotation={[0.05, Math.PI * 1.05, 0]} // + 精确侧面视角，车头朝左
    />
  );
}

// 🌟 修复后的大灯和体积光束组件
function HeadlightAndBeam() {
  return (
    <group>
      {/* 1. 模拟体积光束的圆锥体 */}
      <primitive
        object={new THREE.Mesh(
          new THREE.ConeGeometry(0.15, 6, 32), 
          new THREE.MeshEmissiveMaterial({   
            color: '#ffffff',
            emissive: '#ffffff',
            emissiveIntensity: 10, 
            transparent: true,     
            opacity: 0.4,          
            depthWrite: false // 避免光束遮挡车身产生奇怪的锯齿
          })
        )}
        // 调整位置和旋转，让光锥底部朝前射出
        position={[2.0, 0.2, 0]} 
        rotation={[0, 0, -Math.PI / 2]} 
      />
      
      {/* 2. 真实的点光源，用于照亮车前方 */}
      <pointLight 
        position={[2.0, 0.2, 0]} 
        intensity={20} 
        distance={10} 
        color="#ffffff" 
      />
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
  
  const [range, setRange] = useState('---');
  const [temp, setTemp] = useState('16');
  const [locationText, setLocationText] = useState('上海 · 230米');

  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await AsyncStorage.getItem('teslaRefreshToken');
      if (savedToken) setRefreshToken(savedToken);
    };
    loadToken();
  }, []);

  const handleSaveAndRefresh = async () => {
    if (!refreshToken.trim()) {
      Alert.alert('提示', '请先输入 Refresh Token');
      return;
    }
    await AsyncStorage.setItem('teslaRefreshToken', refreshToken);
    Alert.alert('成功', 'Token 已保存！正在尝试刷新...');
    fetchAccessToken();
  };

  const fetchAccessToken = async () => {
    try {
      const res = await fetch('https://auth.tesla.cn/oauth2/v3/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: 'ownerapi'
        })
      });
      const data = await res.json();
      if (data.access_token) {
        setAccessToken(data.access_token);
        console.log('Access Token 刷新成功');
      } else {
        Alert.alert('错误', 'Token 刷新失败，请检查 Token 是否有效');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('网络错误', errorMessage);
    }
  };

  const fetchCarData = async () => {
    if (!accessToken) {
      await fetchAccessToken();
      return;
    }
    try {
      const vRes = await fetch('https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const vData = await vRes.json();
      const vId = vData.response[0]?.id;
      if (!vId) return;
      setVehicleId(vId);

      const dataRes = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vId}/vehicle_data`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const carData = await dataRes.json();
      
      const chargeState = carData.response?.charge_state;
      const climateState = carData.response?.climate_state;
      
      if (chargeState?.battery_range) setRange(Math.round(chargeState.battery_range).toString());
      if (climateState?.inside_temp) setTemp(climateState.inside_temp.toFixed(1));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('获取车辆数据失败:', errorMessage);
    }
  };

  const sendCommand = async (endpoint: string, body: Record<string, any> = {}) => {
    if (!vehicleId || !accessToken) {
      Alert.alert('提示', '请先刷新车辆数据获取授权信息');
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
        fetchCarData();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert('指令发送失败', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 顶部 3D 渲染区 */}
        <View style={styles.imageContainer}>
          {/* 加入一个兜底的加载动画覆盖在底层 */}
          <View style={StyleSheet.absoluteFill}>
            <FallbackLoader />
          </View>

          {/* 🌟 给 Canvas 添加 style 属性（图示修改点 2） */}
          <Canvas 
            style={styles.canvas} // + 这里加上
            // 🌟 重新调整相机位置以精确配合侧视图
            camera={{ position: [3.5, 2.8, 7.2], fov: 40 }} 
          >
            {/* 🌟 为了突出大灯和光束，降低整体环境光亮度 */}
            <ambientLight intensity={0.5} /> // ← 降低环境光
            <directionalLight position={[10, 10, 5]} intensity={1} color="white" /> // ← 降低辅助灯
            <directionalLight position={[-10, 5, -5]} intensity={0.5} color="white" /> // ← 降低辅助灯

            <Suspense fallback={null}>
              <Tesla3DModel />
              {/* 🌟 核心：模型加载后，开启大灯和体积光束 */}
              <HeadlightAndBeam /> 
            </Suspense>

            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              minPolarAngle={Math.PI / 2.5} 
              maxPolarAngle={Math.PI / 2.5}
            />
          </Canvas>

          <View style={styles.statusBadge}>
            {/* 🌟 更新状态栏文本以匹配图二（可选） */}
            <Text style={styles.statusText}>00:40 已驻车</Text>
          </View>
        </View>

        {/* 🌟 界面文字和布局在后视图区域不变，保持清晰明了 */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>小攀的购物车</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.rangeText}>{range} km</Text>
              <Text style={styles.subText}>续航</Text>
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

          <View style={styles.tokenSection}>
            <TextInput
              style={styles.input}
              placeholder="粘贴你的 Refresh Token"
              placeholderTextColor="#888"
              value={refreshToken}
              onChangeText={setRefreshToken}
              secureTextEntry={true}
            />
            <TouchableOpacity style={styles.buttonWhite} onPress={handleSaveAndRefresh}>
              <Text style={styles.buttonTextDark}>💾 保存并刷新 Token</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonGray} onPress={fetchCarData}>
              <Text style={styles.buttonText}>🔄 刷新车辆数据</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageContainer: { height: 250, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  
  // 🌟 新增 canvas 样式，强制它完全覆盖容器（图示修改点 1）
  canvas: {
    ...StyleSheet.absoluteFillObject, // + 关键！让 Canvas 完全覆盖容器
  },
  
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, // 加载动画的居中样式
  statusBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, zIndex: 10 },
  statusText: { color: '#fff', fontSize: 14, fontWeight: '500' },
  content: { padding: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  rangeText: { fontSize: 24, fontFamily: 'Courier', color: '#fff' },
  subText: { fontSize: 12, color: '#888', marginTop: 4 },
  infoGrid: { flexDirection: 'row', marginBottom: 32 },
  infoCol: { flex: 1, alignItems: 'center' },
  tempText: { fontSize: 36, fontFamily: 'Courier', color: '#fff' },
  locationText: { fontSize: 18, color: '#fff', paddingBottom: 6 },
  controls: { gap: 12 },
  buttonDark: { backgroundColor: '#1C1C1E', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonGreen: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonWhite: { backgroundColor: '#fff', paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12 },
  buttonGray: { backgroundColor: '#2C2C2E', paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '500' },
  buttonTextDark: { color: '#000', fontSize: 18, fontWeight: '600' },
  tokenSection: { marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#2C2C2E' },
  input: { backgroundColor: '#1C1C1E', color: '#fff', padding: 16, borderRadius: 16, fontSize: 14, marginBottom: 12 }
});
