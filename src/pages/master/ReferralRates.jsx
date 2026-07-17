import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function ReferralRates() {
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/referrals/rates');
        const l1 = data.data.find(r => r.level === '1');
        const l2 = data.data.find(r => r.level === '2');
        reset({ level1: l1?.percentage ?? 0, level2: l2?.percentage ?? 0 });
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load referral rates');
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const onSubmit = async (form) => {
    try {
      await api.put('/referrals/rates', { level1: parseFloat(form.level1), level2: parseFloat(form.level2) });
      toast.success('Referral rates saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save referral rates');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-heading font-semibold">Referral Commission Rates</h1>
        <p className="text-sm text-muted-foreground">2-level MLM commission — % of every transaction the referred customer makes</p>
      </div>

      <div className="card max-w-md">
        <div className="card-body">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-group">
                <label className="form-label-required">Level 1 % <span className="text-muted-foreground font-normal">(direct referrer)</span></label>
                <input type="number" step="0.01" min="0" max="100" className="form-input"
                  {...register('level1', { required: true, min: 0, max: 100 })} />
              </div>
              <div className="form-group">
                <label className="form-label-required">Level 2 % <span className="text-muted-foreground font-normal">(referrer's referrer)</span></label>
                <input type="number" step="0.01" min="0" max="100" className="form-input"
                  {...register('level2', { required: true, min: 0, max: 100 })} />
              </div>
              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
