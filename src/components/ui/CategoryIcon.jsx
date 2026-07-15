import React from "react";
import * as PhosphorIcons from "@phosphor-icons/react";

// Ánh xạ từ emoji sang tên icon Phosphor
export const EMOJI_TO_PHOSPHOR = {
  // Ăn uống
  "🍜": "ForkKnife",
  "🍕": "Pizza",
  "🍔": "Hamburger",
  "☕": "Coffee",
  "🥗": "BowlFood",
  "🍳": "CookingPot",
  
  // Di chuyển
  "🚗": "Car",
  "🚌": "Bus",
  "🚕": "Taxi",
  "✈️": "Airplane",
  "🚇": "Train",
  "⛽": "GasPump",
  
  // Mua sắm
  "🛒": "ShoppingCart",
  "👕": "TShirt",
  "👟": "Sneaker",
  "💄": "Sparkle",
  "🎁": "Gift",
  "🛍️": "ShoppingBag",
  
  // Hóa đơn & Tài chính
  "📄": "Receipt",
  "📝": "Notepad",
  "💰": "Wallet",
  "💵": "Money",
  "📈": "ChartLineUp",
  "🏦": "Bank",
  "💳": "CreditCard",
  
  // Giải trí
  "🎬": "FilmStrip",
  "🎮": "GameController",
  "🎵": "MusicNotes",
  "📱": "DeviceMobile",
  "⚽": "SoccerBall",
  "🏋️": "Barbell",
  
  // Y tế
  "💊": "Pill",
  "🏥": "Hospital",
  "🦷": "Tooth",
  "💉": "Syringe",
  
  // Giáo dục & Công việc
  "📚": "Books",
  "🎓": "GraduationCap",
  "💻": "Laptop",
  "💡": "Lightbulb",
  "🔧": "Wrench",
  "🎯": "Target",
  "⭐": "Star",
  
  // Khác
  "🏠": "House",
  "💧": "Drop",
  "📞": "Phone",
  "🏪": "Storefront",
  "📦": "Package",
};

// Danh sách các icon Phosphor dùng để user chọn khi tạo Category mới
export const PHOSPHOR_ICON_NAMES = [
  "ForkKnife", "Coffee", "Car", "Airplane", "ShoppingCart", "TShirt",
  "Gift", "ShoppingBag", "Receipt", "Wallet", "Money", "ChartLineUp",
  "Bank", "CreditCard", "FilmStrip", "GameController", "MusicNotes",
  "DeviceMobile", "SoccerBall", "Barbell", "Pill", "Hospital", "Books",
  "GraduationCap", "Laptop", "Lightbulb", "Wrench", "Target", "Star",
  "House", "Drop", "Phone", "Storefront", "Package"
];

const CategoryIcon = ({ icon, className = "w-5 h-5", weight = "duotone", ...props }) => {
  if (!icon) {
    const Fallback = PhosphorIcons["Package"];
    return <Fallback className={className} weight={weight} {...props} />;
  }

  // 1. Kiểm tra xem icon có phải là emoji đã được ánh xạ không
  let iconName = EMOJI_TO_PHOSPHOR[icon];
  
  // 2. Nếu không có trong ánh xạ emoji, có thể nó đã là tên của một Phosphor Icon (ví dụ: "ForkKnife")
  if (!iconName) {
    iconName = icon; 
  }

  // 3. Lấy component Icon từ thư viện Phosphor
  const IconComponent = PhosphorIcons[iconName];

  // 4. Nếu tồn tại, render nó, nếu không dùng Package làm mặc định
  if (IconComponent) {
    return <IconComponent className={className} weight={weight} {...props} />;
  }

  const Fallback = PhosphorIcons["Package"];
  return <Fallback className={className} weight={weight} {...props} />;
};

export default CategoryIcon;
