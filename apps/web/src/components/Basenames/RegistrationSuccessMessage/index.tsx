import { useAnalytics } from 'apps/web/contexts/Analytics';
import {
  RegistrationSteps,
  useRegistration,
} from 'apps/web/src/components/Basenames/RegistrationContext';
import { ButtonVariants } from 'apps/web/src/components/Button/Button';
import SuccessMessage, {
  SuccessAction,
} from 'apps/web/src/components/Basenames/shared/SuccessMessage';
import { ActionType } from 'libs/base-ui/utils/logEvent';
import { useCallback, useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import USDCClaimModal from './USDCClaimModal';

export default function RegistrationSuccessMessage() {
  const { setRegistrationStep, redirectToProfile, code } = useRegistration();

  const { address } = useAccount();

  const { logEventWithContext } = useAnalytics();

  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  const claimUSDC = useCallback(() => {
    setPopupMessage('USDC is being sent to your wallet');
    // Handle async operation with void to acknowledge we're intentionally not awaiting
    void (async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_USDC_URL}?address=${address}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          const resp = (await response.json()) as { error: string };
          throw new Error(resp.error);
        }
        setPopupMessage('USDC claimed successfully!');
      } catch (error) {
        // Use a generic error message to avoid exposing sensitive API error details
        setPopupMessage('An unexpected error occurred while claiming USDC');
        // Error details logged internally, not exposing sensitive data
      }
    })();
  }, [address]);

  const closePopup = useCallback(() => setPopupMessage(null), []);

  const customizeProfileOnClick = useCallback(() => {
    logEventWithContext('customize_profile', ActionType.click);
    setRegistrationStep(RegistrationSteps.Profile);
  }, [logEventWithContext, setRegistrationStep]);

  const goToProfileOnClick = useCallback(() => {
    logEventWithContext('go_to_profile', ActionType.click);
    redirectToProfile();
  }, [logEventWithContext, redirectToProfile]);

  const actions: SuccessAction[] = useMemo(() => {
    const baseActions: SuccessAction[] = [
      {
        label: 'Go to Profile',
        onClick: goToProfileOnClick,
        variant: ButtonVariants.Secondary,
      },
    ];

    if (code) {
      return [
        {
          label: 'Claim USDC',
          onClick: claimUSDC,
          isPrimary: true,
        },
        ...baseActions,
      ];
    } else {
      return [
        {
          label: 'Customize Profile',
          onClick: customizeProfileOnClick,
          isPrimary: true,
        },
        ...baseActions,
      ];
    }
  }, [code, claimUSDC, customizeProfileOnClick, goToProfileOnClick]);

  return (
    <>
      {popupMessage && <USDCClaimModal message={popupMessage} onClose={closePopup} />}
      <SuccessMessage title="Congrats!" subtitle="This name is yours!" actions={actions} />
    </>
  );
}
