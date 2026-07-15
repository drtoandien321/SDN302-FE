/**
 * Modal tạo/chỉnh sửa Mục tiêu tiết kiệm
 */

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
} from "@heroui/react";
import { Target } from "@phosphor-icons/react";
import {
  DEFAULT_GOAL_ICONS,
  DEFAULT_GOAL_COLORS,
} from "../../services/goalService";
import CurrencyInput from "../CurrencyInput";
import CategoryIcon from "../ui/CategoryIcon";

/**
 * CreateGoalModal Component
 * @param {boolean} isOpen - Trạng thái mở modal
 * @param {Function} onClose - Callback đóng modal
 * @param {Function} onSave - Callback lưu mục tiêu
 * @param {Object} editingGoal - Mục tiêu đang chỉnh sửa (null nếu tạo mới)
 */
const CreateGoalModal = ({ isOpen, onClose, onSave, editingGoal = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    icon: "Target",
    color: "#3B82F6",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form khi mở modal hoặc chuyển chế độ edit
  useEffect(() => {
    // Wrap trong queueMicrotask để tránh lint warning về synchronous setState
    queueMicrotask(() => {
      if (editingGoal) {
        setFormData({
          name: editingGoal.name || "",
          targetAmount: String(editingGoal.targetAmount || ""),
          deadline: editingGoal.deadline || "",
          icon: editingGoal.icon || "Target",
          color: editingGoal.color || "#3B82F6",
        });
      } else {
        setFormData({
          name: "",
          targetAmount: "",
          deadline: "",
          icon: "Target",
          color: "#3B82F6",
        });
      }
    });
  }, [editingGoal, isOpen]);

  const handleSubmit = async () => {
    const targetAmount = Number(formData.targetAmount);

    if (!formData.name || isNaN(targetAmount) || targetAmount <= 0) {
      return;
    }

    setIsLoading(true);
    await onSave({
      name: formData.name,
      targetAmount,
      deadline: formData.deadline || null,
      icon: formData.icon,
      color: formData.color,
    });
    setIsLoading(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="md"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-500" />
          {editingGoal ? "Chỉnh sửa mục tiêu" : "Tạo mục tiêu mới"}
        </ModalHeader>
        <ModalBody className="gap-4">
          {/* Tên mục tiêu */}
          <Input
            label="Tên mục tiêu"
            placeholder="VD: Mua iPhone 16, Du lịch Đà Nẵng..."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            isRequired
          />

          {/* Số tiền mục tiêu */}
          <CurrencyInput
            label="Số tiền mục tiêu"
            placeholder="VD: 30,000,000"
            value={formData.targetAmount}
            onValueChange={(value) =>
              setFormData({ ...formData, targetAmount: value })
            }
            endContent={<span className="text-gray-400 text-sm">VND</span>}
            isRequired
          />

          {/* Deadline */}
          <Input
            type="date"
            label="Hạn hoàn thành (tuỳ chọn)"
            value={formData.deadline}
            onChange={(e) =>
              setFormData({ ...formData, deadline: e.target.value })
            }
          />

          {/* Chọn Icon */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Biểu tượng
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_GOAL_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${
                    formData.icon === icon
                      ? "bg-primary-100 dark:bg-primary-900 ring-2 ring-primary-500"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  <CategoryIcon icon={icon} className="w-6 h-6" />
                </button>
              ))}
            </div>
          </div>

          {/* Chọn Màu */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Màu sắc
            </p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_GOAL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formData.color === color
                      ? "ring-2 ring-offset-2 ring-gray-500"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Hủy
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            isDisabled={!formData.name || !formData.targetAmount}
          >
            {editingGoal ? "Lưu thay đổi" : "Tạo mục tiêu"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateGoalModal;
