// app/SettingsMenu.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
  refreshToken: string;
  accessToken: string;
  vehicleId: string;
  accountName: string;
  accountAvatar: string;
  accountEmail: string; 
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
  accountName,
  accountAvatar,
  accountEmail,
  onLogin,
  onLogout,
  onOpenMap
}: SettingsMenuProps) {

  const [showModal, setShowModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_WIDTH)).current;

  // 侧滑全屏动画
  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setShowModal(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={showModal}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.menuContainer, { transform: [{ translateX: slideAnim }] }]}>
        <SafeAreaView style={{ flex: 1 }}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={28} color="#fff" />
              <Text style={styles.headerTitle}>菜单</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {!refreshToken ? (
              <View style={styles.unauthView}>
                <Ionicons name="person-circle-outline" size={80} color="#444" />
                <Text style={styles.unauthText}>您尚未登录特斯拉账号</Text>
                <TouchableOpacity style={styles.buttonAuthRed} onPress={onLogin}>
                  <Text style={styles.buttonTextWhiteLarge}>去登录</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.profileSection}>
                  <Image
                    source={{
                      uri: accountAvatar ? accountAvatar : 'https://www.gravatar.com/avatar/0?d=mp',
                      headers: {
                        'User-Agent': 'TeslaV4/4.54.3 (com.teslamotors.TeslaApp; build:4107; iOS 17.0.0) Alamofire/5.2.1',
                        'Accept': '*/*'
                      }
                    }}
                    style={styles.avatar}
                  />
                  
                  <Text style={styles.userName}>
                    {accountName || 'Tesla 车主'}
                  </Text>
                  
                  <Text style={styles.userEmail}>
                    {accountEmail}
                  </Text>
                </View>

                <View style={styles.settingsList}>
                  <TouchableOpacity style={styles.settingItem}>
                    {/* 🌟 UI 配色改动：图标改为中灰色 #8E8E93 */}
                    <Ionicons name="gift-outline" size={22} color="#8E8E93" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#5C5C5E" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={onOpenMap}>
                    {/* 充电站保持特有的绿色辨识度 */}
                    <Ionicons name="location-outline" size={22} color="#10B981" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#5C5C5E" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem}>
                    {/* 🌟 UI 配色改动：图标改为中灰色 #8E8E93 */}
                    <Ionicons name="shield-checkmark-outline" size={22} color="#8E8E93" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#5C5C5E" />
                  </TouchableOpacity>
                </View>

                {/* 🌟 还原官方胶囊红色线框按钮 */}
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                  <Text style={styles.logoutButtonText}>退出登录</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#111111', // 🌟 UI 配色：官方深空灰
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    paddingBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 2,
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
  profileSection: {
    alignItems: 'flex-start',
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262626', // 🌟 UI 配色：暗淡分割线
    paddingBottom: 30,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    backgroundColor: '#333'
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#888',
    fontSize: 13
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
    borderBottomColor: '#1C1C1E', // 🌟 UI 配色：列表线更暗
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
    borderColor: '#E31937', // 🌟 红色线框
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20
  },
  logoutButtonText: {
    color: '#E31937',
    fontSize: 15,
    fontWeight: '600'
  }
});
