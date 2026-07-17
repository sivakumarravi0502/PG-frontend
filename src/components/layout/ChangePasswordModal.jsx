import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Modal from '../ui/Modal';

export default function ChangePasswordModal({ open, onOpenChange }) {
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm();

  const submit = async (form) => {
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    }
  };

  return (
    <Modal open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }} title="Change Password">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div className="form-group">
          <label className="form-label-required">Current Password</label>
          <input type="password" className="form-input" {...register('currentPassword', { required: 'Required' })} />
          {errors.currentPassword && <p className="form-error">{errors.currentPassword.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label-required">New Password</label>
          <input type="password" className="form-input"
            {...register('newPassword', { required: 'Required', minLength: { value: 6, message: 'Minimum 6 characters' } })} />
          {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
        </div>
        <div className="form-group">
          <label className="form-label-required">Confirm New Password</label>
          <input type="password" className="form-input"
            {...register('confirmPassword', {
              required: 'Required',
              validate: (v) => v === watch('newPassword') || 'Passwords do not match',
            })} />
          {errors.confirmPassword && <p className="form-error">{errors.confirmPassword.message}</p>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-outline" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Change Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
