import useBasenameChain from 'apps/web/src/hooks/useBasenameChain';
import UpgradeableRegistrarControllerAbi from 'apps/web/src/abis/UpgradeableRegistrarControllerAbi';
import { UPGRADEABLE_REGISTRAR_CONTROLLER_ADDRESSES } from 'apps/web/src/addresses/usernames';
import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';

/**
 * Hook to check if the current wallet address is the pending owner
 * of the UpgradeableRegistrarController contract
 */
export function usePendingOwnerStatus() {
  const { address } = useAccount();
  const { basenameChain } = useBasenameChain();

  const contractAddress = UPGRADEABLE_REGISTRAR_CONTROLLER_ADDRESSES[basenameChain.id];

  // Read the pendingOwner from the contract
  const { data: pendingOwner, isLoading: isPendingOwnerLoading } = useReadContract({
    address: contractAddress,
    abi: UpgradeableRegistrarControllerAbi,
    functionName: 'pendingOwner',
    chainId: basenameChain.id,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });

  // Read the current owner from the contract
  // Note: This is returned for display purposes in the UI (e.g., showing who the current owner is)
  const { data: currentOwner, isLoading: isOwnerLoading } = useReadContract({
    address: contractAddress,
    abi: UpgradeableRegistrarControllerAbi,
    functionName: 'owner',
    chainId: basenameChain.id,
    query: {
      enabled: !!contractAddress && !!address,
    },
  });

  // Determine if the current user is the pending owner
  const isPendingOwner = useMemo(() => {
    if (!address || !pendingOwner) return false;
    return pendingOwner.toLowerCase() === address.toLowerCase();
  }, [address, pendingOwner]);

  const isLoading = isPendingOwnerLoading || isOwnerLoading;

  return {
    isPendingOwner,
    pendingOwner,
    currentOwner,
    isLoading,
  };
}
