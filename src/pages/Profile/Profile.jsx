import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Input,
  Button,
  Avatar,
  Divider,
  Switch,
  Select,
  SelectItem,
  Chip,
} from "@heroui/react";
import { User, Database, FloppyDisk as Save, Moon, Sun, SignOut as LogOut, CaretRight as ChevronRight, Bell, Wallet, Bank as Landmark, CheckCircle as CheckCircle2, Trophy, Star, Medal } from "@phosphor-icons/react";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Link } from "react-router-dom";
import * as authApi from "../../services/authApi";
import { renderGoogleButton, isGoogleConfigured } from "../../services/googleAuth";
import SecuritySettings from "../../components/SecuritySettings/SecuritySettings";
import PageHeader from "../../components/ui/PageHeader";

const GOOGLE_LINK_ERROR_MESSAGES = {
  GOOGLE_ALREADY_LINKED: "Tài khoản này đã được liên kết với Google.",
  GOOGLE_ACCOUNT_ALREADY_LINKED:
    "Tài khoản Google này đã được liên kết với một tài khoản khác.",
  GOOGLE_EMAIL_MISMATCH:
    "Email của tài khoản Google phải trùng với email đăng nhập hiện tại.",
};

const LOCALE_OPTIONS = [
  { key: "vi-VN", label: "Tiếng Việt" },
  { key: "en-US", label: "English" },
];

const TIMEZONE_OPTIONS = [
  { key: "Asia/Ho_Chi_Minh", label: "(GMT+7) Hà Nội, TP.HCM" },
  { key: "Asia/Bangkok", label: "(GMT+7) Bangkok" },
  { key: "UTC", label: "(GMT+0) UTC" },
];

/**
 * Trang Quản lý Tài khoản (Profile)
 * Cho phép user chỉnh sửa thông tin cá nhân, cấu hình API Key và cài đặt ứng dụng
 */
const Profile = () => {
  const { currentUser, settings, updateUserProfile, logout, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const googleLinkBtnRef = useRef(null);
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  // State cho form chỉnh sửa profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [locale, setLocale] = useState("vi-VN");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  // State riêng cho từng toggle thông báo - lưu ngay khi bật/tắt (giống Theme)
  const [savingSetting, setSavingSetting] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setEmail(currentUser.email || "");
      setAvatarUrl(currentUser.avatarUrl || "");
      setLocale(currentUser.locale || "vi-VN");
      setTimezone(currentUser.timezone || "Asia/Ho_Chi_Minh");
    }
  }, [currentUser]);

  // Xử lý cập nhật thông tin cá nhân
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setMessage({
        type: "error",
        content: "Tên hiển thị không được để trống",
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile({
        displayName,
        avatarUrl: avatarUrl.trim() || null,
        locale,
        timezone,
      });
      setMessage({ type: "success", content: "Cập nhật hồ sơ thành công!" });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        content: error.message || "Lỗi khi cập nhật hồ sơ",
      });
    } finally {
      setLoading(false);
      // Tự động ẩn thông báo sau 3s
      setTimeout(() => setMessage({ type: "", content: "" }), 3000);
    }
  };

  // Bật/tắt 1 loại thông báo - lưu ngay lên BE (PATCH /me), không cần bấm Lưu
  const handleToggleSetting = async (key, value) => {
    setSavingSetting(key);
    try {
      await updateUserProfile({ settings: { [key]: value } });
    } catch (error) {
      console.error(error);
      setMessage({
        type: "error",
        content: error.message || "Lỗi khi cập nhật cài đặt thông báo",
      });
      setTimeout(() => setMessage({ type: "", content: "" }), 3000);
    } finally {
      setSavingSetting(null);
    }
  };

  // Render nút Google GIS cho luồng liên kết (chỉ khi chưa liên kết)
  useEffect(() => {
    if (currentUser?.googleSub) return;
    if (!googleLinkBtnRef.current) return;
    renderGoogleButton(
      googleLinkBtnRef.current,
      async (idToken) => {
        try {
          setLinkingGoogle(true);
          await authApi.linkGoogleAccount(idToken);
          await refreshUser();
          setMessage({ type: "success", content: "Liên kết Google thành công!" });
        } catch (error) {
          console.error(error);
          setMessage({
            type: "error",
            content:
              GOOGLE_LINK_ERROR_MESSAGES[error?.code] ||
              error?.message ||
              "Không thể liên kết tài khoản Google.",
          });
        } finally {
          setLinkingGoogle(false);
          setTimeout(() => setMessage({ type: "", content: "" }), 3000);
        }
      },
      (error) => {
        setMessage({
          type: "error",
          content: error?.message || "Không thể liên kết tài khoản Google.",
        });
      }
    );
  }, [currentUser?.googleSub, refreshUser]);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <PageHeader
        title="Quản lý tài khoản"
        subtitle="Cập nhật thông tin và cài đặt ứng dụng"
      />

      {/* Thông báo Feedback */}
      {message.content && (
        <div
          className={`p-3 rounded-[10px] text-sm font-medium ${
            message.type === "success"
              ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
              : "bg-danger-50 text-danger-700 dark:bg-danger-500/15 dark:text-danger-400"
          }`}
        >
          {message.content}
        </div>
      )}

      {/* 1. Thông tin cá nhân */}
      <Card className="border border-white/20 dark:border-white/10 bg-background/60 backdrop-blur-xl shadow-xl overflow-hidden" radius="lg">
        <CardBody className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row gap-6 relative">
            {/* Avatar Section */}
            <div className="flex-shrink-0 text-center sm:text-left">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary via-purple-500 to-pink-500 rounded-full blur-md opacity-60 animate-pulse"></div>
                <div className="p-1 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-pink-500 relative">
                  <Avatar
                    src={avatarUrl || currentUser?.photoURL}
                    name={displayName}
                    className="w-28 h-28 text-3xl font-bold border-4 border-background"
                    color="primary"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-2 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-amber-500/20 shadow-sm" title="Người dùng Tích cực">
                  <Star weight="duotone" className="w-4 h-4" /> Bạc
                </div>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500/10 to-purple-500/20 text-purple-600 dark:text-purple-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-purple-500/20 shadow-sm" title="Tiết kiệm giỏi">
                  <Trophy weight="duotone" className="w-4 h-4" /> 5 Mục tiêu
                </div>
              </div>
            </div>

            {/* Edit Info Form */}
            <div className="flex-1 w-full space-y-4 pt-4 sm:pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-12">
                <Input
                  label="Tên hiển thị"
                  placeholder="Nhập tên của bạn"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setIsEditing(true);
                  }}
                  variant="faded"
                  labelPlacement="outside"
                  radius="sm"
                />
                <Input
                  label="Email"
                  value={email}
                  isReadOnly
                  variant="flat"
                  labelPlacement="outside"
                  radius="sm"
                  description="Email không thể thay đổi khi đăng nhập bằng Google"
                  className="opacity-70"
                />
                <Input
                  label="Ảnh đại diện (URL)"
                  placeholder="https://..."
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setIsEditing(true);
                  }}
                  variant="faded"
                  labelPlacement="outside"
                  radius="sm"
                  description="Dán link ảnh có sẵn (Google, Imgur...)"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Ngôn ngữ"
                    variant="faded"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={[locale]}
                    onSelectionChange={(keys) => {
                      setLocale(Array.from(keys)[0] || "vi-VN");
                      setIsEditing(true);
                    }}
                  >
                    {LOCALE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} textValue={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <Select
                    label="Múi giờ"
                    variant="faded"
                    labelPlacement="outside"
                    radius="sm"
                    selectedKeys={[timezone]}
                    onSelectionChange={(keys) => {
                      setTimezone(Array.from(keys)[0] || "Asia/Ho_Chi_Minh");
                      setIsEditing(true);
                    }}
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} textValue={opt.label}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end pt-2">
                  <Button
                    color="primary"
                    startContent={<Save size={18} />}
                    isLoading={loading}
                    onPress={handleUpdateProfile}
                    size="md"
                    className="font-medium bg-gradient-to-r from-primary-500 to-purple-500 shadow-lg shadow-primary-500/30 text-white"
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </div>
          </div>

          <Divider className="my-8" />

          {/* Liên kết tài khoản Google */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-medium text-foreground">
                Tài khoản Google
              </p>
              <p className="text-sm text-default-600">
                {currentUser?.googleSub
                  ? "Bạn có thể đăng nhập bằng email/mật khẩu hoặc Google."
                  : "Liên kết để có thể đăng nhập nhanh bằng Google."}
              </p>
            </div>
            {currentUser?.googleSub ? (
              <Chip
                color="success"
                variant="flat"
                className="bg-success-50 dark:bg-success-500/20"
                startContent={<CheckCircle2 className="w-4 h-4" />}
              >
                Đã liên kết với Google
              </Chip>
            ) : isGoogleConfigured() ? (
              <div ref={googleLinkBtnRef} className={linkingGoogle ? "opacity-50 pointer-events-none" : ""} />
            ) : (
              <p className="text-xs text-default-500">
                Đăng nhập Google chưa được cấu hình.
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      {/* 2. Cài đặt Ứng dụng */}
      <Card className="border border-white/20 dark:border-white/10 bg-background/60 backdrop-blur-xl shadow-xl" radius="lg">
        <CardHeader className="bg-content1/50 px-6 py-5 border-b border-divider/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              Cài đặt ứng dụng
            </h2>
          </div>
        </CardHeader>
        <CardBody className="p-3">
          <div className="flex flex-col gap-1">
            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-default-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-primary/10 text-primary dark:bg-primary/20">
                  {theme === "dark" ? <Moon weight="duotone" size={22} /> : <Sun weight="duotone" size={22} />}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Giao diện (Theme)
                  </p>
                  <p className="text-sm text-default-600">
                    Chuyển đổi giữa Sáng và Tối
                  </p>
                </div>
              </div>
              <Switch
                isSelected={theme === "dark"}
                onValueChange={(isSelected) =>
                  setTheme(isSelected ? "dark" : "light")
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Nhắc nhở hàng ngày */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-default-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-blue-500/10 text-blue-500 dark:bg-blue-500/20">
                  <Bell weight="duotone" size={22} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Nhắc ghi chép hàng ngày
                  </p>
                  <p className="text-sm text-default-600">
                    Nhắc nếu bạn quên ghi chép thu chi trong ngày
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.dailyReminderEnabled ?? false}
                isDisabled={savingSetting === "dailyReminderEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("dailyReminderEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Cảnh báo ngân sách */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-default-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-amber-500/10 text-amber-500 dark:bg-amber-500/20">
                  <Wallet weight="duotone" size={22} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Cảnh báo ngân sách
                  </p>
                  <p className="text-sm text-default-600">
                    Báo khi chi tiêu vượt ngưỡng cảnh báo của ngân sách
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.budgetWarningEnabled ?? false}
                isDisabled={savingSetting === "budgetWarningEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("budgetWarningEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Nhắc nợ đến hạn */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-default-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-purple-500/10 text-purple-500 dark:bg-purple-500/20">
                  <Landmark weight="duotone" size={22} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Nhắc nợ đến hạn
                  </p>
                  <p className="text-sm text-default-600">
                    Báo khi khoản nợ/cho vay sắp hoặc đã đến hạn
                  </p>
                </div>
              </div>
              <Switch
                isSelected={settings?.debtReminderEnabled ?? false}
                isDisabled={savingSetting === "debtReminderEnabled"}
                onValueChange={(value) =>
                  handleToggleSetting("debtReminderEnabled", value)
                }
                color="primary"
                size="md"
              />
            </div>

            {/* Data Tools */}
            <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-default-100 transition-all duration-300 hover:scale-[1.01] hover:shadow-sm cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-[12px] bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20">
                  <Database weight="duotone" size={22} />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    Dữ liệu & Công cụ
                  </p>
                  <p className="text-sm text-default-600">
                    Sao lưu, phục hồi và nhập liệu nâng cao
                  </p>
                </div>
              </div>
              <Button
                as={Link}
                to="/data-tools"
                variant="flat"
                color="primary"
                className="bg-primary-50 dark:bg-primary/20 font-medium group-hover:scale-105 transition-transform"
                endContent={<ChevronRight size={16} weight="bold" />}
              >
                Truy cập
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 3. Bảo mật */}
      <SecuritySettings />

      {/* Logout Button */}
      <div className="flex justify-center pt-4">
        <Button
          color="danger"
          variant="flat"
          startContent={<LogOut size={20} weight="duotone" />}
          onPress={logout}
          className="w-full sm:w-auto min-w-[220px] font-medium bg-danger-50 dark:bg-danger/20 text-danger-600 dark:text-danger-400 hover:scale-105 transition-transform shadow-sm"
        >
          Đăng xuất tài khoản
        </Button>
      </div>
    </div>
  );
};

export default Profile;
