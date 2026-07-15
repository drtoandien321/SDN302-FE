import { useState } from "react";
import { Input } from "@heroui/react";
import {
  formatAmountInput,
  parseAmountInput,
} from "../utils/formatCurrency";

/**
 * Input tiền VND dùng giá trị số thuần trong state.
 *
 * Khi đang gõ, input hiển thị chuỗi số chưa format để trình duyệt không làm
 * nhảy con trỏ sau mỗi dấu phân cách hàng nghìn. Khi blur mới hiển thị định
 * dạng vi-VN. onValueChange luôn nhận chuỗi chỉ gồm chữ số.
 */
const CurrencyInput = ({ value = "", onValueChange, onFocus, onBlur, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);
  const rawValue = parseAmountInput(value);
  const displayValue = isFocused ? rawValue : formatAmountInput(rawValue);

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      value={displayValue}
      onValueChange={(nextValue) =>
        onValueChange?.(parseAmountInput(nextValue))
      }
      onFocus={(event) => {
        setIsFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setIsFocused(false);
        onBlur?.(event);
      }}
    />
  );
};

export default CurrencyInput;
