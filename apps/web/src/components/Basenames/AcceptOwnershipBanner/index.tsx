'use client';
import { useCallback } from 'react';
import { usePendingOwnerStatus } from 'apps/web/src/hooks/usePendingOwnerStatus';
import {
  useAcceptOwnership,
  WriteTransactionWithReceiptStatus,
} from 'apps/web/src/hooks/useAcceptOwnership';
import WalletIdentity from 'apps/web/src/components/WalletIdentity';

export default function AcceptOwnershipBanner() {
  const { isPendingOwner, currentOwner, isLoading: isPendingOwnerLoading } = usePendingOwnerStatus();
  const {
    acceptOwnership,
    transactionStatus,
    transactionIsLoading,
    transactionIsSuccess,
    transactionIsError,
    transactionError,
  } = useAcceptOwnership();

  const handleAcceptOwnership = useCallback(async () => {
    try {
      await acceptOwnership();
    } catch (error) {
      console.error('Failed to accept ownership:', error);
    }
  }, [acceptOwnership]);

  // Don't show the banner if the user is not the pending owner
  if (isPendingOwnerLoading || !isPendingOwner) {
    return null;
  }

  // Don't show after successful acceptance
  if (transactionIsSuccess) {
    return null;
  }

  const isProcessing =
    transactionStatus === WriteTransactionWithReceiptStatus.Initiated ||
    transactionStatus === WriteTransactionWithReceiptStatus.Approved ||
    transactionStatus === WriteTransactionWithReceiptStatus.Processing;

  const canAccept = !transactionIsLoading && !isProcessing;

  return (
    <div className="mb-6 rounded-2xl border border-yellow-500 bg-yellow-50 p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Pending Ownership Transfer
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            You have been designated as the pending owner of the UpgradeableRegistrarController.
            Accept ownership to complete the transfer.
          </p>
        </div>

        {currentOwner && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Current owner:</span>
            <WalletIdentity address={currentOwner} />
          </div>
        )}

        {transactionIsError && transactionError && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">Error accepting ownership</p>
            <p className="mt-1 text-xs">{transactionError.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              void handleAcceptOwnership();
            }}
            disabled={!canAccept}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Accept Ownership'}
          </button>

          {transactionStatus !== WriteTransactionWithReceiptStatus.Idle && (
            <span className="flex items-center text-sm text-gray-600">
              Status: {transactionStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
