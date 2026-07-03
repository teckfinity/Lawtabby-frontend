import { useEffect, useState } from 'react';
import SubscriptionPopup from '@/components/SubscriptionPopup';
import {
  emitUpgradeRequired,
  setUpgradeRequiredHandler,
  type UpgradeRequiredDetail,
} from '@/api/upgradeRequired';
import { getUserProfile } from '@/api/user';

const UpgradeRequiredListener = () => {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<UpgradeRequiredDetail | null>(null);
  const [currentPlan, setCurrentPlan] = useState('Starter');

  useEffect(() => {
    setUpgradeRequiredHandler((payload) => {
      setDetail(payload);
      setOpen(true);
      getUserProfile()
        .then((profile) => {
          const planName =
            profile?.subscription?.plan?.name ||
            profile?.plan ||
            'Starter';
          setCurrentPlan(planName);
        })
        .catch(() => setCurrentPlan('Starter'));
    });
    return () => setUpgradeRequiredHandler(null);
  }, []);

  return (
    <SubscriptionPopup
      isOpen={open}
      onClose={() => {
        setOpen(false);
        setDetail(null);
      }}
      currentPlan={currentPlan}
      upgradeDetail={detail}
    />
  );
};

export default UpgradeRequiredListener;

// Re-export for tests / manual triggers
export { emitUpgradeRequired };
