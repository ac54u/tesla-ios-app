import { Center, Text as ThreeText, useGLTF } from '@react-three/drei/native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, Text as RNText, StyleSheet, View } from 'react-native';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 🌟 完美还原特斯拉官方的“锚定引线 HUD”
const TeslaLineHud = ({ position, label, height = 0.4, action }: { position: any, label: string, height?: number, action: () => void }) => {
  return (
    // 整个组件放置在车身的表面坐标上
    <group position={position} onClick={(e) => { e.stopPropagation(); action(); }}>
      
      {/* 1. 紧贴车身表面的锚点 (发光小圆点) */}
      <mesh>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* 2. 垂直向上的连线 (原点在中心，所以我们把它向上平移高度的一半，就能刚好连接锚点和文字) */}
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.002, 0.002, height]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
      </mesh>

      {/* 3. 顶部的悬浮 3D 中文标记 */}
      <ThreeText 
        position={[0, height + 0.06, 0]} // 放在线条的最顶端
        fontSize={0.07} 
        color="#ffffff"
        outlineWidth={0.004}
        outlineColor="#000000" // 黑色描边，防止在白车上看不清
      >
        {label}
      </ThreeText>
      
    </group>
  );
};

export default function Tesla3DModel({ setModelLoaded }: Tesla3DModelProps) {
  const { scene } = useGLTF('https://cdn.jsdelivr.net/gh/ac54u/tesla-ios-app@main/assets/tesla_cybertruck.glb') as any;
  
  useEffect(() => { 
    setModelLoaded(true); 
  }, [setModelLoaded]);

  return (
    <group position={[0, -0.5, 0]}>
      <Center>
        <group scale={1.65} rotation={[0, -Math.PI / 2.5, 0]}>
          
          <primitive object={scene} />

          {/* 🌟 极简官方风 HUD，精确锚定在车壳表面 🌟 */}
          
          {/* 前备箱盖表面 */}
          <TeslaLineHud 
            position={[0, 0.35, 1.2]} 
            height={0.35}
            label="打开前备箱"
            action={() => Alert.alert('前备箱', '正在开启...')} 
          />
          
          {/* 后备箱盖表面 */}
          <TeslaLineHud 
            position={[0, 0.45, -1.3]} 
            height={0.4}
            label="打开后备箱"
            action={() => Alert.alert('后备箱', '正在开启...')} 
          />

          {/* 左侧车门表面 */}
          <TeslaLineHud 
            position={[0.85, 0.4, 0.1]} 
            height={0.4}
            label="解锁"
            action={() => Alert.alert('车门', '车辆已解锁')} 
          />

          {/* 左后充电口表面 */}
          <TeslaLineHud 
            position={[0.9, 0.4, -0.9]} 
            height={0.3}
            label="充电口"
            action={() => Alert.alert('充电口', '正在打开充电口盖')} 
          />

        </group>
      </Center>
    </group>
  );
}

export function FallbackLoader() {
  return (
    <View style={styles.loaderContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <RNText style={{ color: '#888', marginTop: 10 }}>模型解析中...</RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});