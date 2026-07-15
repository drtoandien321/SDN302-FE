import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import * as authApi from "../services/authApi";
import { hasSession, getCachedUser } from "../services/tokenStore";
import { AUTH_LOGOUT_EVENT } from "../services/apiClient";

/**
 * AuthContext - Quản lý xác thực dựa trên JWT của Backend Ví Vi Vu.
 * (Thay thế hoàn toàn Firebase Auth.)
 *
 * @typedef {Object} AuthContextType
 * @property {Object|null} currentUser - User đã chuẩn hoá (có .uid, .email, .displayName, .photoURL)
 * @property {boolean} loading - Đang kiểm tra phiên đăng nhập
 * @property {Object|null} settings - User settings từ BE
 * @property {Object|null} defaultLedger - Sổ mặc định từ BE
 */

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => getCachedUser());
  const [settings, setSettings] = useState(null);
  const [defaultLedger, setDefaultLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  // Tăng mỗi khi có auth action chủ động (login/logout). Kết quả bootstrap cũ
  // chỉ được cập nhật state nếu nó vẫn thuộc đúng thế hệ phiên hiện tại.
  const authGenerationRef = useRef(0);

  /** Tải lại thông tin user hiện tại từ BE để xác thực phiên. */
  const refreshUser = useCallback(async () => {
    const generation = authGenerationRef.current;
    if (!hasSession()) {
      setCurrentUser(null);
      setLoading(false);
      return null;
    }
    try {
      const { user, settings: s, defaultLedger: dl } = await authApi.fetchMe();
      if (generation !== authGenerationRef.current) return null;
      setCurrentUser(user);
      setSettings(s);
      setDefaultLedger(dl);
      return user;
    } catch {
      // Token không hợp lệ / không refresh được -> coi như đã đăng xuất
      if (generation === authGenerationRef.current) {
        setCurrentUser(null);
      }
      return null;
    } finally {
      if (generation === authGenerationRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Kiểm tra phiên khi khởi động app
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Lắng nghe sự kiện logout phát ra từ apiClient khi refresh token thất bại
  useEffect(() => {
    const onForcedLogout = () => {
      authGenerationRef.current += 1;
      setCurrentUser(null);
      setSettings(null);
      setDefaultLedger(null);
      setLoading(false);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, onForcedLogout);
  }, []);

  /* ----------------------------- Auth actions ----------------------------- */

  const beginAuthAction = useCallback(() => {
    authGenerationRef.current += 1;
    // Public login vẫn có thể được thao tác khi bootstrap phiên cũ đang chạy.
    // Auth action mới trở thành nguồn sự thật và không phải chờ bootstrap nữa.
    setLoading(false);
    return authGenerationRef.current;
  }, []);

  const hydrateAuthenticatedUser = useCallback(async (user, generation) => {
    if (generation !== authGenerationRef.current) return user;

    setCurrentUser(user);
    const { settings: s, defaultLedger: dl } = await authApi.fetchMe();
    if (generation === authGenerationRef.current) {
      setSettings(s);
      setDefaultLedger(dl);
    }
    return user;
  }, []);

  const loginWithEmail = useCallback(async (credentials) => {
    const generation = beginAuthAction();
    const user = await authApi.loginEmail(credentials);
    return hydrateAuthenticatedUser(user, generation);
  }, [beginAuthAction, hydrateAuthenticatedUser]);

  const verifyOtp = useCallback(async (payload) => {
    const generation = beginAuthAction();
    const user = await authApi.verifyEmailOtp(payload);
    return hydrateAuthenticatedUser(user, generation);
  }, [beginAuthAction, hydrateAuthenticatedUser]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const generation = beginAuthAction();
    const user = await authApi.loginWithGoogle(idToken);
    return hydrateAuthenticatedUser(user, generation);
  }, [beginAuthAction, hydrateAuthenticatedUser]);

  const logout = useCallback(async () => {
    beginAuthAction();
    await authApi.logout();
    setCurrentUser(null);
    setSettings(null);
    setDefaultLedger(null);
  }, [beginAuthAction]);

  /** Cập nhật hồ sơ (displayName, avatarUrl, locale, timezone, settings). */
  const updateUserProfile = useCallback(async (data) => {
    const payload = {};
    if (data.displayName !== undefined) payload.displayName = data.displayName;
    if (data.photoURL !== undefined) payload.avatarUrl = data.photoURL;
    if (data.avatarUrl !== undefined) payload.avatarUrl = data.avatarUrl;
    if (data.locale !== undefined) payload.locale = data.locale;
    if (data.timezone !== undefined) payload.timezone = data.timezone;
    if (data.settings !== undefined) payload.settings = data.settings;
    const { user, settings: s } = await authApi.updateMe(payload);
    setCurrentUser(user);
    if (s) setSettings(s);
    return user;
  }, []);

  const value = {
    currentUser,
    loading,
    settings,
    defaultLedger,
    refreshUser,
    loginWithEmail,
    verifyOtp,
    loginWithGoogle,
    logout,
    updateUserProfile,
    // Đăng ký/OTP không đổi state nên dùng trực tiếp từ authApi
    register: authApi.registerEmail,
    resendOtp: authApi.resendEmailOtp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
