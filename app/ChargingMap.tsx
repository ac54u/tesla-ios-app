import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// 定义传入的参数格式
interface ChargingMapProps {
  visible: boolean;
  onClose: () => void;
  accessToken: string;
  vehicleId: string;
}

export default function ChargingMap({ visible, onClose, accessToken, vehicleId }: ChargingMapProps) {
  const [chargingSites, setChargingSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 当弹窗打开时，拉取附近的超充站数据
  useEffect(() => {
    if (visible && accessToken && vehicleId) {
      fetchNearbyChargers();
    }
  }, [visible]);

  const fetchNearbyChargers = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`https://fleet-api.prd.cn.vn.cloud.tesla.cn/api/1/vehicles/${vehicleId}/nearby_charging_sites`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      
      if (res.ok && data.response) {
        // 特斯拉 API 返回的数据里通常包含 superchargers 和 destination_chargers
        setChargingSites(data.response.superchargers || []);
      } else {
        setErrorMsg('无法获取附近超充数据');
      }
    } catch (error) {
      setErrorMsg('网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* 顶部导航栏 */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>附近超级充电站</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close-circle" size={30} color="#444" />
          </TouchableOpacity>
        </View>

        {/* 内容区 */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.centerView}>
              <ActivityIndicator size="large" color="#E31937" />
              <Text style={styles.loadingText}>正在扫描附近电桩...</Text>
            </View>
          ) : errorMsg ? (
            <View style={styles.centerView}>
              <Ionicons name="warning-outline" size={50} color="#666" />
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchNearbyChargers}>
                <Text style={styles.retryBtnText}>重试</Text>
              </TouchableOpacity>
            </View>
          ) : chargingSites.length === 0 ? (
            <View style={styles.centerView}>
              <Ionicons name="battery-dead-outline" size={50} color="#666" />
              <Text style={styles.errorText}>附近没有找到超级充电站</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {chargingSites.map((site, index) => (
                <View key={index} style={styles.siteCard}>
                  <View style={styles.siteHeader}>
                    <Text style={styles.siteName}>{site.name || '特斯拉超级充电站'}</Text>
                    <Text style={styles.distance}>{(site.distance_miles * 1.60934).toFixed(1)} km</Text>
                  </View>
                  
                  <View style={styles.siteDetails}>
                    <View style={styles.detailRow}>
                      <Ionicons name="flash" size={16} color="#10B981" />
                      <Text style={styles.detailText}>
                        空闲: <Text style={styles.highlightText}>{site.available_stalls}</Text> / {site.total_stalls}
                      </Text>
                    </View>
                    {/* 你可以在这里继续扩展其他信息，比如充电功率等 */}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  content: { flex: 1, padding: 15 },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', marginTop: 15, fontSize: 16 },
  errorText: { color: '#888', marginTop: 15, fontSize: 16 },
  retryBtn: { marginTop: 20, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#1C1C1E', borderRadius: 8 },
  retryBtnText: { color: '#fff', fontSize: 14 },
  siteCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 20, marginBottom: 15 },
  siteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  siteName: { color: '#fff', fontSize: 18, fontWeight: 'bold', flex: 1 },
  distance: { color: '#888', fontSize: 14, marginLeft: 10 },
  siteDetails: { flexDirection: 'column', gap: 8 },
  detailRow: { flexDirection: 'row', alignItems: 'center' },
  detailText: { color: '#aaa', fontSize: 14, marginLeft: 6 },
  highlightText: { color: '#10B981', fontWeight: 'bold', fontSize: 16 },
});