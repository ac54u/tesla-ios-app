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
              {/* 🌟 箭头调整为护眼白 */}
              <Ionicons name="chevron-back" size={28} color="#E3E3E3" />
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
                {/* 🌟 未登录图标调整为稍微明显的次级灰 */}
                <Ionicons name="person-circle-outline" size={80} color="#8E918F" />
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
                    {/* 🌟 图标改为 Material 次级文本灰 #C4C7C5 */}
                    <Ionicons name="gift-outline" size={22} color="#C4C7C5" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>引荐奖励</Text>
                    </View>
                    {/* 🌟 右侧箭头改为更暗淡的辅助灰 */}
                    <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem} onPress={onOpenMap}>
                    {/* 🌟 绿色调整为暗色模式护眼绿 */}
                    <Ionicons name="location-outline" size={22} color="#81C995" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>附近超级充电站</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.settingItem}>
                    {/* 🌟 图标改为 Material 次级文本灰 #C4C7C5 */}
                    <Ionicons name="shield-checkmark-outline" size={22} color="#C4C7C5" style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingTextPrimary}>隐私与安全</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E918F" />
                  </TouchableOpacity>
                </View>

                {/* 胶囊红色线框按钮 */}
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
    backgroundColor: '#131314', // 🌟 与主页统一的主背景深灰
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
    color: '#E3E3E3', // 🌟 护眼白
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
    color: '#C4C7C5', // 🌟 次级文本灰
    marginTop: 15,
    marginBottom: 30
  },
  buttonAuthRed: {
    backgroundColor: '#B3261E', // 🌟 Material 3 暗色红
    paddingVertical: 16,
    width: '100%',
    borderRadius: 50,
    alignItems: 'center'
  },
  buttonTextWhiteLarge: {
    color: '#E3E3E3', // 🌟 护眼白
    fontSize: 18,
    fontWeight: '700'
  },
  profileSection: {
    alignItems: 'flex-start',
    paddingVertical: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444746', // 🌟 标准深色描边灰
    paddingBottom: 30,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 16,
    backgroundColor: '#1E1F22' // 🌟 头像占位背景改为悬浮灰
  },
  userName: {
    color: '#E3E3E3', // 🌟 护眼白
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    color: '#C4C7C5', // 🌟 次级文本灰
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
    borderBottomColor: '#444746', // 🌟 标准深色描边灰
  },
  settingIcon: {
    marginRight: 15
  },
  settingTextContainer: {
    flex: 1
  },
  settingTextPrimary: {
    color: '#E3E3E3', // 🌟 护眼白
    fontSize: 16,
    fontWeight: '500'
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#F2B8B5', // 🌟 Material 暗色模式的错误状态高亮红 (为了在黑底上清晰)
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginTop: 20
  },
  logoutButtonText: {
    color: '#F2B8B5', // 🌟 同步红色文字
    fontSize: 15,
    fontWeight: '600'
  }
});
