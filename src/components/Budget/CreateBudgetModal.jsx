import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Select,
  SelectItem,
} from "@heroui/react";
import { useBudgetContext } from "../../contexts/BudgetContext";
import { useCategoryContext } from "../../contexts/CategoryContext";
import CurrencyInput from "../CurrencyInput";

const CreateBudgetModal = ({ isOpen, onClose, editingBudget }) => {
  const { addBudget, updateBudget, budgets } = useBudgetContext();
  const { expenseCategories } = useCategoryContext();
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form if editing
  useEffect(() => {
    if (editingBudget) {
      setCategory(editingBudget.category);
      setLimit(editingBudget.limit.toString());
    } else {
      setCategory("");
      setLimit("");
    }
    setError("");
  }, [editingBudget, isOpen]);

  // Lấy danh sách danh mục chi (theo tên) chưa có budget (nếu đang tạo mới)
  const availableCategories = expenseCategories
    .map((c) => c.name)
    .filter(
      (cat) =>
        editingBudget?.category === cat ||
        !budgets.some((b) => b.category === cat)
    );

  const handleSubmit = async () => {
    if (!category || !limit) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const numericLimit = Number(limit);
    if (isNaN(numericLimit) || numericLimit <= 0) {
      setError("Hạn mức phải lớn hơn 0");
      return;
    }

    setIsLoading(true);
    try {
      const budgetData = {
        category,
        limit: numericLimit,
        period: "month",
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, budgetData);
      } else {
        await addBudget(budgetData);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {editingBudget ? "Chỉnh sửa ngân sách" : "Tạo ngân sách mới"}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-4">
                <Select
                  label="Danh mục"
                  placeholder="Chọn danh mục"
                  selectedKeys={category ? [category] : []}
                  onChange={(e) => setCategory(e.target.value)}
                  isDisabled={!!editingBudget} // Không cho đổi category khi edit
                >
                  {(editingBudget
                    ? [editingBudget.category]
                    : availableCategories
                  ).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </Select>

                <CurrencyInput
                  label="Hạn mức chi tiêu (VNĐ)"
                  placeholder="0"
                  value={limit}
                  onValueChange={setLimit}
                  errorMessage={error}
                  isInvalid={!!error}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Hủy
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isLoading}
              >
                {editingBudget ? "Lưu thay đổi" : "Tạo ngân sách"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateBudgetModal;
