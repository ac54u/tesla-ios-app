import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChargingMap({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.container}>
      {/* 🌟 加入 userInterfaceStyle="dark" 让原生苹果地图自动变黑 */}
      <MapView
        style={styles.map}
        userInterfaceStyle="dark"
        initialRegion={{
          latitude: 30.9000, 
          longitude: 121.8000,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        <Marker coordinate={{ latitude: 30.9000, longitude: 121.8000 }}>
          <View style={styles.superchargerMarker}>
            <Ionicons name="flash" size={16} color="#E3E3E3" />
          </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        
        {/* 顶部搜索区 */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            {/* 🌟 图标改为护眼白 */}
            <Ionicons name="chevron-back" size={28} color="#E3E3E3" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            {/* 🌟 搜索图标和占位符改为次级灰 */}
            <Ionicons name="search" size={20} color="#C4C7C5" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="搜索充电站、规划路线" 
              placeholderTextColor="#C4C7C5"
            />
          </View>
        </View>

        {/* 车辆在线提示条 */}
        <View style={styles.onlineNoticeRow}>
          <View style={styles.noticeBox}>
            {/* 🌟 图标改为暗色红 */}
            <Ionicons name="bulb-outline" size={16} color="#B3261E" style={{marginRight: 6}} />
            <Text style={styles.noticeText}>车辆在线时，可显示附近超充占用情况</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="funnel-outline" size={20} color="#E3E3E3" />
          </TouchableOpacity>
        </View>

        {/* 底部悬浮操控区 */}
        <View style={styles.bottomSection} pointerEvents="box-none">
          
          {/* 右下角工具按钮组 */}
          <View style={styles.rightTools}>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="car-outline" size={24} color="#E3E3E3" />
              <Text style={styles.toolBtnText}>发送</Text>
            </TouchableOpacity>
            <View style={styles.toolDivider} />
            <TouchableOpacity style={styles.toolBtn}>
              <MaterialCommunityIcons name="directions-fork" size={24} color="#E3E3E3" />
              <Text style={styles.toolBtnText}>路线</Text>
            </TouchableOpacity>
          </View>

          {/* 🌟 解除地锁按钮改为暗色红 */}
          <TouchableOpacity style={styles.unlockButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="lock-open-variant-outline" size={28} color="#E3E3E3" />
            <Text style={styles.unlockText}>解除地锁</Text>
          </TouchableOpacity>

          {/* 定位按钮 (左下角) */}
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="locate" size={24} color="#E3E3E3" />
          </TouchableOpacity>

        </View>

        {/* 最底部的分类 Tab */}
        <View style={styles.bottomTabs}>
          <Text style={[styles.tabText, styles.tabTextActive]}>⚡ 超级充电</Text>
          <Text style={styles.tabText}>⚡ 目的地充</Text>
          <Text style={styles.tabText}>其他品牌</Text>
          <Text style={styles.tabText}>特友共享</Text>
        </View>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // 🌟 主背景改为统一深灰
  container: { flex: 1, backgroundColor: '#131314' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 10 },
  // 🌟 悬浮组件背景改为 Surface 深灰 #1E1F22，并稍微加深一点阴影透明度以区分地图
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1E1F22', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1F22', marginLeft: 10, height: 44, borderRadius: 22, paddingHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  // 🌟 输入框文字颜色改为护眼白
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#E3E3E3' },
  onlineNoticeRow: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15, alignItems: 'center' },
  noticeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1F22', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  // 🌟 提示文字改为次级灰
  noticeText: { fontSize: 13, color: '#C4C7C5' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#1E1F22', marginLeft: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  bottomSection: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 15, paddingBottom: 20 },
  rightTools: { position: 'absolute', right: 15, bottom: 20, backgroundColor: '#1E1F22', borderRadius: 12, paddingVertical: 10, width: 60, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  toolBtn: { alignItems: 'center', paddingVertical: 10 },
  // 🌟 工具按钮文字
  toolBtnText: { fontSize: 12, color: '#C4C7C5', marginTop: 4 },
  // 🌟 分割线改为深色描边灰
  toolDivider: { width: 30, height: 1, backgroundColor: '#444746', marginVertical: 5 },
  // 🌟 解锁按钮改为暗红色 #B3261E
  unlockButton: { alignSelf: 'center', backgroundColor: '#B3261E', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 30, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  unlockText: { color: '#E3E3E3', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  locationBtn: { position: 'absolute', left: 15, bottom: 20, width: 48, height: 48, backgroundColor: '#1E1F22', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  // 🌟 底部 Tab 栏背景改为最底层的 #131314
  bottomTabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#131314', paddingVertical: 15, paddingBottom: 30 },
  // 🌟 未选中文字颜色
  tabText: { fontSize: 14, color: '#C4C7C5', fontWeight: '500' },
  // 🌟 选中文字高亮颜色 (使用红色的变体，保证在黑底上的可读性)
  tabTextActive: { color: '#F2B8B5', fontWeight: 'bold' },
  // 🌟 地图 Marker 保持高亮红，边框改为背景色融合
  superchargerMarker: { backgroundColor: '#B3261E', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#131314' }
});
