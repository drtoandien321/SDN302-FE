import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Input, Tabs, Tab, Divider } from "@heroui/react";
import { Envelope as Mail, Lock, Eye, EyeClosed as EyeOff, ArrowLeft, ShieldCheck, Sparkle as Sparkles, ChartLine as LineChart } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import * as authApi from "../services/authApi";
import {
  renderGoogleButton,
  isGoogleConfigured,
} from "../services/googleAuth";
import ThemeButton from "../components/ThemeButton";

/**
 * Trang đăng nhập - dùng Backend Ví Vi Vu (JWT + OTP email + Google GIS).
 *
 * Bốn chế độ:
 *  - login: đăng nhập email/mật khẩu
 *  - register: đăng ký -> BE gửi OTP qua email
 *  - otp: nhập mã OTP để hoàn tất đăng ký & tạo phiên
 *  - forgot: quên mật khẩu (bước con forgotStep: email -> reset)
 */

// Map mã lỗi BE -> thông báo tiếng Việt thân thiện
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: "Email hoặc mật khẩu không chính xác.",
  EMAIL_NOT_VERIFIED:
    "Email chưa được xác thực. Vui lòng đăng ký lại để nhận mã OTP.",
  EMAIL_ALREADY_REGISTERED: "Email này đã được đăng ký.",
  INVALID_OR_EXPIRED_OTP: "Mã OTP không đúng hoặc đã hết hạn.",
  OTP_ATTEMPT_LIMIT_EXCEEDED:
    "Bạn đã nhập sai quá số lần cho phép. Vui lòng gửi lại mã.",
  SIGNUP_OTP_NOT_FOUND: "Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.",
  SMTP_NOT_CONFIGURED:
    "Máy chủ chưa cấu hình gửi email. Vui lòng liên hệ quản trị.",
  VALIDATION_ERROR: "Dữ liệu nhập không hợp lệ.",
};

const Login = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    loading: authLoading,
    loginWithEmail,
    loginWithGoogle,
    register,
    verifyOtp,
    resendOtp,
  } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [authMode, setAuthMode] = useState("login"); // login | register | otp | forgot
  const [forgotStep, setForgotStep] = useState("email"); // email | reset
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const googleBtnRef = useRef(null);
  const videoRef = useRef(null); // Reference cho background video

  // Logic làm mờ mượt mà cho background video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let fadeAnimation;
    const fadeTo = (targetOpacity, duration) => {
      cancelAnimationFrame(fadeAnimation);
      const startOpacity = parseFloat(video.style.opacity || "0");
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentOpacity = startOpacity + (targetOpacity - startOpacity) * progress;
        video.style.opacity = currentOpacity.toString();

        if (progress < 1) {
          fadeAnimation = requestAnimationFrame(animate);
        }
      };
      fadeAnimation = requestAnimationFrame(animate);
    };

    const handleCanPlay = () => {
      video.play().catch(() => { });
      fadeTo(1, 500);
    };

    const handleTimeUpdate = () => {
      if (video.duration - video.currentTime <= 0.55) {
        fadeTo(0, 500);
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => { });
        fadeTo(1, 500);
      }, 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      cancelAnimationFrame(fadeAnimation);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  // Lưới an toàn: nếu currentUser đã có (đăng nhập thành công ở AuthContext)
  // nhưng vì lý do gì đó navigate("/") sau khi await login không chạy được
  // (vd. lệnh gọi /me phụ bị lỗi/timeout ném ra sau khi user đã set), tự động
  // điều hướng về trang chủ thay vì để người dùng kẹt ở trang đăng nhập.
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate("/", { replace: true });
    }
  }, [authLoading, currentUser, navigate]);

  const handleError = useCallback((err) => {
    const message =
      ERROR_MESSAGES[err?.code] ||
      err?.message ||
      "Đã xảy ra lỗi. Vui lòng thử lại.";
    setError(message);
  }, []);

  // Render nút Google GIS.
  // Lưu ý: xoá nội dung container trước khi render lại để tránh trường hợp
  // effect chạy 2 lần liên tiếp (StrictMode ở dev, hoặc đổi authMode qua lại)
  // để lại 1 iframe nút Google cũ đã "chết" chồng lên nút mới - khi đó lần
  // bấm đầu tiên rơi vào nút cũ và không có phản hồi gì, phải bấm lần 2 vào
  // đúng nút mới mới đăng nhập được.
  useEffect(() => {
    if (authMode === "otp" || authMode === "forgot") return;
    const container = googleBtnRef.current;
    if (!container) return;
    container.innerHTML = "";
    renderGoogleButton(
      container,
      async (idToken) => {
        try {
          setIsLoading(true);
          setError(null);
          await loginWithGoogle(idToken);
          navigate("/", { replace: true });
        } catch (err) {
          handleError(err);
        } finally {
          setIsLoading(false);
        }
      },
      (err) => handleError(err)
    );
    return () => {
      container.innerHTML = "";
    };
  }, [authMode, loginWithGoogle, navigate, handleError]);

  const getPasswordStrength = (pwd) => {
    const checks = {
      length: pwd.length >= 8,
      hasNumber: /\d/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
    const passedChecks = Object.values(checks).filter(Boolean).length;
    let color = "danger";
    let label = "Yếu";
    if (passedChecks >= 4) {
      color = "success";
      label = "Mạnh";
    } else if (passedChecks >= 3) {
      color = "warning";
      label = "Trung bình";
    }
    return { checks, color, label, passedChecks };
  };

  const passwordStrength = getPasswordStrength(password);

  /** Đăng nhập email/mật khẩu */
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await loginWithEmail({ email, password });
      navigate("/");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Đăng ký -> BE gửi OTP qua email */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await register({
        email,
        password,
        displayName: displayName || undefined,
      });
      setSuccessMessage(`Mã OTP đã được gửi tới ${email}. Vui lòng kiểm tra hộp thư.`);
      setAuthMode("otp");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Xác thực OTP -> tạo phiên đăng nhập */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await verifyOtp({ email, otpCode });
      navigate("/");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Gửi lại OTP */
  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await resendOtp(email);
      setSuccessMessage("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const backToRegister = () => {
    setAuthMode("register");
    setOtpCode("");
    setError(null);
    setSuccessMessage(null);
  };

  /** Mở luồng quên mật khẩu từ tab đăng nhập */
  const openForgotPassword = () => {
    setAuthMode("forgot");
    setForgotStep("email");
    setOtpCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError(null);
    setSuccessMessage(null);
  };

  const backToLoginFromForgot = () => {
    setAuthMode("login");
    setForgotStep("email");
    setError(null);
    setSuccessMessage(null);
  };

  /** Bước 1 quên mật khẩu: yêu cầu gửi OTP đặt lại mật khẩu */
  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Vui lòng nhập email");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await authApi.forgotPassword(email);
      setSuccessMessage(`Nếu email này đã đăng ký, mã OTP đã được gửi tới ${email}.`);
      setForgotStep("reset");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  /** Bước 2 quên mật khẩu: xác thực OTP + đặt mật khẩu mới */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError("Vui lòng nhập đủ 6 số OTP");
      return;
    }
    if (!newPassword || !confirmNewPassword) {
      setError("Vui lòng nhập đầy đủ mật khẩu mới");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (newPassword.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự");
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      await authApi.resetPassword({ email, otpCode, newPassword });
      setSuccessMessage("Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.");
      setAuthMode("login");
      setForgotStep("email");
      setPassword("");
      setOtpCode("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark text-foreground h-screen w-full relative overflow-hidden bg-black selection:bg-white/30">
      {/* Background video phủ toàn bộ màn hình */}
      <video
        ref={videoRef}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
        className="absolute inset-0 w-full h-full object-cover object-bottom z-0 pointer-events-none"
        muted
        playsInline
        preload="auto"
        style={{ opacity: 0 }}
      />

      {/* Overlay gradient tối để chữ dễ đọc và tập trung vào form */}
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/50 to-black/90 pointer-events-none" />

      {/* Container chính: Cố định 100vh, dùng grid căn giữa tuyệt đối độc lập hai cột */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

        {/* Cột trái: Text & Branding */}
        <div className="hidden lg:flex flex-col justify-center items-start text-white pr-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 mb-16 liquid-glass px-5 py-2.5 rounded-full hover:bg-white/10 transition-colors w-fit shadow-xl cursor-pointer">
          </Link>

          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="text-5xl xl:text-7xl tracking-tight leading-[1.15] font-normal"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Quản lý tài chính <br />
            <em className="italic text-white/70">thông minh & hiện đại.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-white/70 text-lg leading-relaxed max-w-md font-light"
          >
            Sống vi vu, không lo túi. Khám phá phong cách quản lý chi tiêu tối giản và tự động hoá với công nghệ AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-14 flex gap-5 w-full max-w-lg"
          >
            <div className="liquid-glass rounded-2xl p-5 flex-1 hover:-translate-y-1 transition-transform group cursor-default">
              <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                <Sparkles size={18} />
              </div>
              <h3 className="font-semibold text-base mb-1.5 tracking-tight">Trợ lý AI</h3>
              <p className="text-white/50 text-sm leading-relaxed">Nhập liệu tốc độ cao qua giọng nói.</p>
            </div>
            <div className="liquid-glass rounded-2xl p-5 flex-1 hover:-translate-y-1 transition-transform group cursor-default">
              <div className="w-10 h-10 rounded-full liquid-glass flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <h3 className="font-semibold text-base mb-1.5 tracking-tight">Bảo mật 100%</h3>
              <p className="text-white/50 text-sm leading-relaxed">Dữ liệu cá nhân được mã hóa an toàn.</p>
            </div>
          </motion.div>
        </div>

        {/* Cột phải: Form xác thực */}
        <div className="flex flex-col items-center justify-center w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="w-full max-w-[420px]"
          >
            {/* Logo cho mobile */}
            <div className="space-y-2 text-center lg:hidden mb-6">
              <div className="liquid-glass inline-flex items-center justify-center p-3 rounded-2xl shadow-xl">
                <img src="/logoApp.png" alt="Ví Vi Vu" className="h-8 w-8 object-contain brightness-0 invert" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>Ví Vi Vu</h1>
            </div>

            {/* Glass card wrapper cho form */}
            <div className="liquid-glass rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl bg-white/[0.02]">
              <AnimatePresence mode="wait">
                {authMode === "otp" ? (
                  /* ----------------------- Bước nhập OTP ----------------------- */
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <button
                      type="button"
                      onClick={backToRegister}
                      className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors w-fit"
                    >
                      <ArrowLeft size={16} /> Quay lại
                    </button>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Xác thực email</h2>
                      <p className="text-sm text-white/50 leading-relaxed">
                        Nhập mã 6 số đã gửi tới <br /><strong className="text-foreground">{email}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-4 mt-2">
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        label="Mã xác thực"
                        placeholder="Nhập 6 số"
                        value={otpCode}
                        onValueChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                        size="lg"
                        variant="bordered"
                        radius="lg"
                        classNames={{ input: "!text-white placeholder:!text-white/30" }}
                        autoFocus
                      />
                      <Button
                        type="submit"
                        color="primary"
                        className="w-full font-semibold shadow-md shadow-primary/25"
                        size="lg"
                        radius="lg"
                        isLoading={isLoading}
                      >
                        Xác nhận
                      </Button>
                    </form>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm font-medium text-primary hover:text-primary-600 transition-colors"
                      >
                        Chưa nhận được mã? Gửi lại
                      </button>
                    </div>
                  </motion.div>
                ) : authMode === "forgot" ? (
                  /* ------------------- Quên mật khẩu ------------------- */
                  <motion.div
                    key="forgot"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <button
                      type="button"
                      onClick={backToLoginFromForgot}
                      className="flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors w-fit"
                    >
                      <ArrowLeft size={16} /> Quay lại đăng nhập
                    </button>

                    {forgotStep === "email" ? (
                      <>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white tracking-tight">Quên mật khẩu</h2>
                          <p className="text-sm text-white/50 leading-relaxed">
                            Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                          </p>
                        </div>

                        <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                          <Input
                            type="email"
                            label="Email"
                            placeholder="your@email.com"
                            value={email}
                            onValueChange={setEmail}
                            variant="bordered"
                            radius="lg"
                            startContent={<Mail size={18} className="text-white/40" />}
                            isRequired
                            autoFocus
                            classNames={{
                              label: "!text-white/70",
                              input: "!text-white placeholder:!text-white/30",
                              inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                            }}
                          />
                          <Button
                            type="submit"
                            color="primary"
                            className="w-full font-semibold shadow-md shadow-primary/25"
                            size="lg"
                            radius="lg"
                            isLoading={isLoading}
                          >
                            Gửi mã OTP
                          </Button>
                        </form>
                      </>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <h2 className="text-2xl font-bold text-white tracking-tight">Đặt lại mật khẩu</h2>
                          <p className="text-sm text-white/50 leading-relaxed">
                            Nhập mã xác thực đã gửi tới <strong className="text-white">{email}</strong> và mật khẩu mới của bạn.
                          </p>
                        </div>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                          <Input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            label="Mã OTP"
                            placeholder="Nhập 6 số"
                            value={otpCode}
                            onValueChange={(v) => setOtpCode(v.replace(/\D/g, "").slice(0, 6))}
                            size="lg"
                            variant="bordered"
                            radius="lg"
                            classNames={{ 
                              input: "!text-white placeholder:!text-white/30",
                              label: "!text-white/70",
                              inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                            }}
                            autoFocus
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            label="Mật khẩu mới"
                            placeholder="Nhập mật khẩu mới"
                            value={newPassword}
                            onValueChange={setNewPassword}
                            variant="bordered"
                            radius="lg"
                            startContent={<Lock size={18} className="text-white/40" />}
                            endContent={
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none p-1 rounded-md hover:bg-white/10 transition-colors">
                                {showPassword ? <EyeOff size={18} className="text-white/40" /> : <Eye size={18} className="text-white/40" />}
                              </button>
                            }
                            isRequired
                            classNames={{
                              label: "!text-white/70",
                              input: "!text-white placeholder:!text-white/30",
                              inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                            }}
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            label="Xác nhận mật khẩu mới"
                            placeholder="Nhập lại mật khẩu mới"
                            value={confirmNewPassword}
                            onValueChange={setConfirmNewPassword}
                            variant="bordered"
                            radius="lg"
                            startContent={<Lock size={18} className="text-white/40" />}
                            isRequired
                            isInvalid={confirmNewPassword && confirmNewPassword !== newPassword}
                            errorMessage={confirmNewPassword && confirmNewPassword !== newPassword ? "Mật khẩu không khớp" : ""}
                            classNames={{
                              label: "!text-white/70",
                              input: "!text-white placeholder:!text-white/30",
                              inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                            }}
                          />
                          <Button
                            type="submit"
                            color="primary"
                            className="w-full font-semibold shadow-md shadow-primary/25 mt-2"
                            size="lg"
                            radius="lg"
                            isLoading={isLoading}
                          >
                            Xác nhận đặt lại
                          </Button>
                        </form>
                      </>
                    )}
                  </motion.div>
                ) : (
                  /* -------------------- Đăng nhập / Đăng ký -------------------- */
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                    className="space-y-7"
                  >
                    <div className="space-y-1.5 text-center">
                      <h2 className="text-2xl font-bold tracking-tight text-white">
                        {authMode === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
                      </h2>
                      <p className="text-sm text-white/50">
                        {authMode === "login" ? "Vui lòng đăng nhập để tiếp tục" : "Bắt đầu hành trình quản lý tài chính"}
                      </p>
                    </div>

                    <Tabs
                      selectedKey={authMode}
                      onSelectionChange={(key) => {
                        setAuthMode(key);
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      variant="underlined"
                      fullWidth
                      classNames={{
                        tabList: "gap-6 w-full border-b border-white/10 p-0",
                        tab: "h-12 px-0 text-md font-medium",
                        tabContent: "group-data-[selected=true]:text-white text-white/50",
                        cursor: "w-full bg-white"
                      }}
                    >
                      <Tab key="login" title="Đăng nhập" />
                      <Tab key="register" title="Đăng ký" />
                    </Tabs>

                    <form onSubmit={authMode === "login" ? handleEmailSignIn : handleRegister} className="space-y-4">
                      <AnimatePresence>
                        {authMode === "register" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}>
                            <Input
                              type="text"
                              label="Tên hiển thị (tuỳ chọn)"
                              placeholder="Nguyễn Văn A"
                              value={displayName}
                              onValueChange={setDisplayName}
                              variant="bordered"
                              radius="lg"
                              classNames={{
                                label: "!text-white/70",
                                input: "!text-white placeholder:!text-white/30",
                                inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                              }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Input
                        type="email"
                        label="Email"
                        placeholder="your@email.com"
                        value={email}
                        onValueChange={setEmail}
                        variant="bordered"
                        radius="lg"
                        startContent={<Mail size={18} className="text-white/40" />}
                        isRequired
                        classNames={{
                          label: "!text-white/70",
                          input: "!text-white placeholder:!text-white/30",
                          inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                        }}
                      />

                      <div className="space-y-2">
                        <Input
                          type={showPassword ? "text" : "password"}
                          label="Mật khẩu"
                          placeholder="Nhập mật khẩu"
                          value={password}
                          onValueChange={setPassword}
                          variant="bordered"
                          radius="lg"
                          startContent={<Lock size={18} className="text-white/40" />}
                          endContent={
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="focus:outline-none p-1 rounded-md hover:bg-white/10 transition-colors">
                              {showPassword ? <EyeOff size={18} className="text-white/40" /> : <Eye size={18} className="text-white/40" />}
                            </button>
                          }
                          isRequired
                          classNames={{
                            label: "!text-white/70",
                            input: "!text-white placeholder:!text-white/30",
                            inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                          }}
                        />

                        {authMode === "login" && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={openForgotPassword}
                              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
                            >
                              Quên mật khẩu?
                            </button>
                          </div>
                        )}
                      </div>

                      <AnimatePresence>
                        {authMode === "register" && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="space-y-4">
                            <Input
                              type={showPassword ? "text" : "password"}
                              label="Xác nhận mật khẩu"
                              placeholder="Nhập lại mật khẩu"
                              value={confirmPassword}
                              onValueChange={setConfirmPassword}
                              variant="bordered"
                              radius="lg"
                              startContent={<Lock size={18} className="text-white/40" />}
                              isRequired
                              isInvalid={confirmPassword && confirmPassword !== password}
                              errorMessage={confirmPassword && confirmPassword !== password ? "Mật khẩu không khớp" : ""}
                              classNames={{
                                label: "!text-white/70",
                                input: "!text-white placeholder:!text-white/30",
                                inputWrapper: "!border-white/15 hover:!border-white/30 !bg-white/5"
                              }}
                            />

                            {password && (
                              <div className="space-y-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-white/60">Độ mạnh mật khẩu</span>
                                  <span className={`text-sm font-bold text-${passwordStrength.color}`}>
                                    {passwordStrength.label}
                                  </span>
                                </div>
                                <div className="flex gap-1.5">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                      key={i}
                                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= passwordStrength.passedChecks
                                        ? passwordStrength.color === "success"
                                          ? "bg-success shadow-[0_0_8px_rgba(23,201,100,0.5)]"
                                          : passwordStrength.color === "warning"
                                            ? "bg-warning shadow-[0_0_8px_rgba(245,165,36,0.5)]"
                                            : "bg-danger shadow-[0_0_8px_rgba(243,18,96,0.5)]"
                                        : "bg-white/10"
                                        }`}
                                    />
                                  ))}
                                </div>
                                <p className="text-xs text-white/40 leading-relaxed">
                                  Tối thiểu 8 ký tự. Nên có chữ hoa, chữ thường, số và ký tự đặc biệt để bảo mật tốt hơn.
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        color="primary"
                        className="w-full font-semibold shadow-md shadow-primary/25 mt-2"
                        size="lg"
                        radius="lg"
                        isLoading={isLoading}
                      >
                        {authMode === "login" ? "Đăng nhập" : "Đăng ký tài khoản"}
                      </Button>
                    </form>

                    <div className="flex items-center gap-4 py-2">
                      <Divider className="flex-1 bg-white/10" />
                      <span className="text-xs font-medium text-white/30 uppercase tracking-wider">hoặc tiếp tục với</span>
                      <Divider className="flex-1 bg-white/10" />
                    </div>

                    {/* Nút Google (render bởi GIS) - bọc nền nhẹ */}
                    <div className="flex justify-center h-10 w-full overflow-hidden rounded-lg opacity-90 hover:opacity-100 transition-opacity bg-white/5 border border-white/10">
                      {isGoogleConfigured() ? (
                        <div ref={googleBtnRef} className="w-full flex justify-center [&>div]:w-full [&>div>div]:w-full" />
                      ) : (
                        <p className="text-xs text-center text-white/40 p-2 w-full">
                          Đăng nhập Google chưa cấu hình.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="mt-6 p-4 bg-red-950/60 border border-red-800/50 rounded-xl liquid-glass backdrop-blur-md">
                    <p className="text-sm font-medium text-red-400 text-center flex items-center justify-center gap-2">
                      <span>⚠️</span> {error}
                    </p>
                  </motion.div>
                )}
                {successMessage && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="mt-6 p-4 bg-green-950/60 border border-green-800/50 rounded-xl liquid-glass backdrop-blur-md">
                    <p className="text-sm font-medium text-green-400 text-center flex items-center justify-center gap-2">
                      <span>✅</span> {successMessage}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <p className="text-xs text-center text-white/40 font-medium mt-6">
              Bằng cách tiếp tục, bạn đồng ý với{" "}
              <Link to="/terms-of-service" className="text-white/60 hover:text-white underline decoration-white/20 hover:decoration-white transition-all">Điều khoản</Link>
              {" "}và{" "}
              <Link to="/privacy-policy" className="text-white/60 hover:text-white underline decoration-white/20 hover:decoration-white transition-all">Bảo mật</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
