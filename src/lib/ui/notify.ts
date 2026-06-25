import { toast } from "sonner";

/** 策划向操作反馈（简体中文） */
export const notify = {
  success(message: string, description?: string) {
    toast.success(message, description ? { description } : undefined);
  },
  error(message: string, description?: string) {
    toast.error(message, description ? { description } : undefined);
  },
  warning(message: string, description?: string) {
    toast.warning(message, description ? { description } : undefined);
  },
  info(message: string, description?: string) {
    toast.info(message, description ? { description } : undefined);
  },
  loading(message: string, id?: string | number) {
    return toast.loading(message, id !== undefined ? { id } : undefined);
  },
  dismiss(id?: string | number) {
    toast.dismiss(id);
  },
};
