import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChargingMap({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.container}>
      {/* 🌟 原生底图 (这里默认使用苹果/谷歌地图，如需高德需额外配置) */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 30.9000, // 这里可以换成你上海特斯拉工厂附近的坐标
          longitude: 121.8000,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
      >
        {/* 模拟一个超级充电站的 Marker */}
        <Marker coordinate={{ latitude: 30.9000, longitude: 121.8000 }}>
          <View style={styles.superchargerMarker}>
            <Ionicons name="flash" size={16} color="#fff" />
          </View>
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        
        {/* 顶部搜索区 */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#000" />
          </TouchableOpacity>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="搜索充电站、规划路线" 
              placeholderTextColor="#888"
            />
          </View>
        </View>

        {/* 车辆在线提示条 */}
        <View style={styles.onlineNoticeRow}>
          <View style={styles.noticeBox}>
            <Ionicons name="bulb-outline" size={16} color="#E31937" style={{marginRight: 6}} />
            <Text style={styles.noticeText}>车辆在线时，可显示附近超充占用情况</Text>
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Ionicons name="funnel-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* 底部悬浮操控区 */}
        <View style={styles.bottomSection} pointerEvents="box-none">
          
          {/* 右下角工具按钮组 */}
          <View style={styles.rightTools}>
            <TouchableOpacity style={styles.toolBtn}>
              <Ionicons name="car-outline" size={24} color="#000" />
              <Text style={styles.toolBtnText}>发送</Text>
            </TouchableOpacity>
            <View style={styles.toolDivider} />
            <TouchableOpacity style={styles.toolBtn}>
              <MaterialCommunityIcons name="directions-fork" size={24} color="#000" />
              <Text style={styles.toolBtnText}>路线</Text>
            </TouchableOpacity>
          </View>

          {/* 🌟 标志性的红色解除地锁按钮 */}
          <TouchableOpacity style={styles.unlockButton} activeOpacity={0.8}>
            <MaterialCommunityIcons name="lock-open-variant-outline" size={28} color="#fff" />
            <Text style={styles.unlockText}>解除地锁</Text>
          </TouchableOpacity>

          {/* 定位按钮 (左下角) */}
          <TouchableOpacity style={styles.locationBtn}>
            <Ionicons name="locate" size={24} color="#000" />
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
  container: { flex: 1, backgroundColor: '#fff' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, marginTop: 10 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginLeft: 10, height: 44, borderRadius: 22, paddingHorizontal: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16, color: '#000' },
  onlineNoticeRow: { flexDirection: 'row', paddingHorizontal: 15, marginTop: 15, alignItems: 'center' },
  noticeBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  noticeText: { fontSize: 13, color: '#555' },
  filterBtn: { width: 44, height: 44, backgroundColor: '#fff', marginLeft: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  bottomSection: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 15, paddingBottom: 20 },
  rightTools: { position: 'absolute', right: 15, bottom: 20, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 10, width: 60, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  toolBtn: { alignItems: 'center', paddingVertical: 10 },
  toolBtnText: { fontSize: 12, color: '#333', marginTop: 4 },
  toolDivider: { width: 30, height: 1, backgroundColor: '#eee', marginVertical: 5 },
  unlockButton: { alignSelf: 'center', backgroundColor: '#E31937', paddingHorizontal: 35, paddingVertical: 16, borderRadius: 30, flexDirection: 'row', alignItems: 'center', shadowColor: '#E31937', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  unlockText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  locationBtn: { position: 'absolute', left: 15, bottom: 20, width: 48, height: 48, backgroundColor: '#fff', borderRadius: 24, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  bottomTabs: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', paddingVertical: 15, paddingBottom: 30 },
  tabText: { fontSize: 14, color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#E31937', fontWeight: 'bold' },
  superchargerMarker: { backgroundColor: '#E31937', padding: 6, borderRadius: 20, borderWidth: 2, borderColor: '#fff' }
});