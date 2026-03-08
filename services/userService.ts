import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_KEY = 'tesla_user_cache';

export interface TeslaUser {
  full_name: string;
  email: string;
  profile_image_url: string;
}

// 读取缓存
export async function getCachedUser(): Promise<TeslaUser | null> {
  try {
    const cache = await AsyncStorage.getItem(USER_CACHE_KEY);
    if (!cache) return null;
    return JSON.parse(cache);
  } catch {
    return null;
  }
}

// 请求 Tesla userinfo
export async function fetchTeslaUser(accessToken: string): Promise<TeslaUser> {
  const timestamp = Date.now();

  // 👇 关键修改 1：改用你抓包抓到的特斯拉官方深度 Owner API
  const res = await fetch(
    `https://owner-api.vn.cloud.tesla.cn/api/1/users/me?_t=${timestamp}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 👇 关键修改 2：加上你抓到的这三个核心暗号，完美伪装官方 App
        'User-Agent': 'TeslaV4/4.54.3 (com.teslamotors.TeslaApp; build:4107; iOS 17.0.0) Alamofire/5.2.1',
        'x-tesla-user-agent': 'com.teslamotors.TeslaApp/4.54.3-4107/95c112b72/iOS/17.0',
        'x-tesla-app-key': 'ECA4731EFEB2FAD23EEAC17BD9C00AFA8A2E422F',
        'Cache-Control': 'no-cache',
        Accept: '*/*'
      }
    }
  );

  const data = await res.json();
  
  // 👇 关键修改 3：官方 Owner API 的数据是包裹在 response 字段里面的！
  const userData = data.response || {};

  const user: TeslaUser = {
    full_name: userData.full_name || userData.name || 'Tesla 车主',
    email: userData.email || '已隐藏邮箱',
    profile_image_url:
      userData.profile_image_url ||
      userData.picture ||
      'https://www.gravatar.com/avatar/0?d=mp'
  };

  await AsyncStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));

  return user;
}
