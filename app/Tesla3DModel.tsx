import React, { useEffect } from 'react';
// 注意：为了不和 3D 文字冲突，我们把原生的 Text 重命名为 RNText
import { ActivityIndicator, Alert, Text as RNText, StyleSheet, View } from 'react-native';
// 🌟 引入能在原生手机上渲染 3D 文字的 Text 组件
import { Center, Text as ThreeText, useGLTF } from '@react-three/drei/native';

export interface Tesla3DModelProps {
  setModelLoaded: (loaded: boolean) => void;
}

// 🌟 原生兼容版：全 3D 悬浮控制点
const ControlPoint = ({ position, label, action }: { position: any, label: string, action: () => void }) => {
  return (
    <group position={position}>
      {/* 1. 贴在车身上的光点 */}
      <mesh onClick={(e) => { e.stopPropagation(); action(); }}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      
      {/* 2. 向上延伸的细线 */}
      <mesh position={[0, 0.35, 0]} onClick={(e) => { e.stopPropagation(); action(); }}>
        <cylinderGeometry args={[0.003, 0.003, 0.7]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.4} />
      </mesh>

      {/* 3. 纯 3D 渲染的悬浮英文字母 */}
      <ThreeText 
        position={[0, 0.8, 0]} 
        fontSize={0.15} 
        color="#ffffff"
        outlineWidth={0.01}
        outlineColor="#000000" // 黑色描边，防止在白车上看不清
        onClick={(e) => { e.stopPropagation(); action(); }}
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

          {/* 🌟 极简科幻风的控制点 (使用英文防乱码) */}
          
          <ControlPoint 
            position={[0, 0.7, 2.0]} 
            label="FRUNK" // 前备箱
            action={() => Alert.alert('指令', '即将打开前备箱')} 
          />
          
          <ControlPoint 
            position={[0, 0.8, -2.2]} 
            label="TRUNK" // 后备箱
            action={() => Alert.alert('指令', '即将打开后备箱')} 
          />

          <ControlPoint 
            position={[1.0, 1.0, 0.2]} 
            label="UNLOCK" // 解锁车门 (稍微调高了一点)
            action={() => Alert.alert('指令', '即将解锁车辆')} 
          />

          <ControlPoint 
            position={[1.0, 0.6, -1.6]} 
            label="CHARGE" // 充电口
            action={() => Alert.alert('指令', '即将开启充电口')} 
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