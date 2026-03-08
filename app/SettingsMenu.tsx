import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import { fetchTeslaUser, getCachedUser } from '../services/userService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  refreshToken: string;
  accessToken: string;
  vehicleId: string;
  onLogin: () => void;
  onLogout: () => void;
  onOpenMap: () => void;
}

export default function SettingsMenu({
  visible,
  onClose,
  refreshToken,
  accessToken,
  vehicleId,
  onLogin,
  onLogout,
  onOpenMap
}: SettingsMenuProps) {

  const [userInfo, setUserInfo] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  
  // 👇 动画控制状态
  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current; // 初始位置在屏幕最右侧(隐藏)

  // 侧滑动画逻辑
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 0, // 滑动到屏幕内
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH, // 滑出屏幕右侧
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false); // 动画结束后再彻底卸载 Modal
      });
    }
  }, [visible]);

  const refreshUser = async () => {
    if (!accessToken) return;
    setLoadingUser(true);
    try {
      const user = await fetchTeslaUser(accessToken);
      setUserInfo(user);
    } catch (e) {
      console.log('userinfo error', e);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    const loadCache = async () => {
      const cache = await getCachedUser();
      if (cache) setUserInfo(cache);
    };
    if (visible) loadCache();
  }, [visible]);

  useEffect(() => {
    if (visible && accessToken) {
      refreshUser();
    }
  }, [visible, accessToken]);

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none" // 关掉系统默认的自下而上动画，使用我们自定义的侧滑
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* 点击左侧黑色半透明区域可以关闭菜单 */}
        <TouchableOpacity style={styles.closeBackground} activeOpacity={1} onPress={onClose} />
        
        {/* 👇 核心侧滑面板 */}
        <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
          <SafeAreaView style={{ flex: 1 }}>
            
            {/* 顶部关闭按钮 */}
            <View style={styles.header}>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={loadingUser} onRefresh={refreshUser} tintColor="#fff" />
              }
            >
              {!refreshToken ? (
                // 没登录的状态
                <View style={styles.unauthView}>
                  <Ionicons name="person-circle-outline" size={80} color="#444" />
                  <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>
                  <TouchableOpacity style={styles.buttonAuthRed} onPress={onLogin}>
                    <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // 已登录的状态
                <View>
                  {/* 👇 全新排版：靠左对齐，复刻官方 UI */}
                  <View style={styles.profileSection}>
                    {loadingUser && !userInfo ? (
                      <ActivityIndicator size="small" color="#fff" style={{ alignSelf: 'flex-start', margin: 20 }} />
                    ) : (
                      <>
                        <Image
                          source={{
                            uri: userInfo?.profile_image_url && userInfo.profile_image_url.includes('tesla.cn')
                              ? userInfo.profile_image_url
                              : 'https://www.gravatar.com/avatar/0?d=mp',
                            headers: {
                              'User-Agent': 'TeslaV4/4.54.3 (com.teslamotors.TeslaApp; build:4107; iOS 17.0.0) Alamofire/5.2.1',
                              'Accept': '*/*'
                            }
                          }}
                          style={styles.avatar}
                        />
                        <Text style={styles.userName}>
                          {userInfo?.full_name || 'Tesla 车主'}
                        </Text>
                        <Text style={styles.userEmail}>
                          {userInfo?.email || '未知邮箱'}
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.settingsList}>
                    <TouchableOpacity style={styles.settingItem}>
                      <Ionicons name="gift-outline" size={22} color="#fff" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem} onPress={() => { if (vehicleId) onOpenMap(); else Alert.alert('提示', '请等待数据加载'); }}>
                      <Ionicons name="location-outline" size={22} color="#10B981" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                      <Ionicons name="shield-checkmark-outline" size={22} color="#fff" style={styles.settingIcon} />
                      <View style={styles.settingTextContainer}>
                        <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutButtonText}>退出登录</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row', // 横向布局，让菜单贴在右侧
    backgroundColor: 'rgba(0,0,0,0.5)', // 左侧半透明遮罩
  },
  closeBackground: {
    flex: 1, 
    // 占据左侧剩余空间，点击即可关闭
  },
  menuContainer: {
    width: '85%', // 菜单占据屏幕宽度的 85%
    backgroundColor: '#111',
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 10,
    alignItems: 'flex-end', // 关闭按钮靠右
  },
  closeBtn: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 24,
  },
  unauthView: {
    alignItems: 'center',
    marginTop: 60
  },
  unauthText: {
    color: '#888',
    marginTop: 15,
    marginBottom: 30
  },
  buttonAuthRed: {
    backgroundColor: '#E31937',
    paddingVertical: 16,
    width: '100%',
    borderRadius: 50,
    alignItems: 'center'
  },
  buttonTextWhiteLarge: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700'
  },
  // 👇 重新排版的用户资料区域
  profileSection: {
    alignItems: 'flex-start', // 靠左对齐
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
    paddingBottom: 30,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 16,
    backgroundColor: '#333'
  },
  userName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 14
  },
  settingsList: {
    marginTop: 10,
    marginBottom: 30
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E', // 更淡的分割线
  },
  settingIcon: {
    marginRight: 15
  },
  settingTextContainer: {
    flex: 1
  },
  settingTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#E31937',
    paddingVertical: 16,
    borderRadius: 50, // 官方样式的圆角按钮
    alignItems: 'center',
    marginTop: 20
  },
  logoutButtonText: {
    color: '#E31937',
    fontSize: 16,
    fontWeight: '600'
  }
});
