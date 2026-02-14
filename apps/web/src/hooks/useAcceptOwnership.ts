import { useCallback } from 'react';
import { ContractFunctionParameters } from 'viem';
import useBasenameChain from 'apps/web/src/hooks/useBasenameChain';
import useWriteContractWithReceipt, {
  WriteTransactionWithReceiptStatus,
} from 'apps/web/src/hooks/useWriteContractWithReceipt';
import UpgradeableRegistrarControllerAbi from 'apps/web/src/abis/UpgradeableRegistrarControllerAbi';
import { UPGRADEABLE_REGISTRAR_CONTROLLER_ADDRESSES } from 'apps/web/src/addresses/usernames';

/**
 * Hook to accept ownership of the UpgradeableRegistrarController contract
 * This is the second step in a two-step ownership transfer process
 */
export function useAcceptOwnership() {
  const { basenameChain } = useBasenameChain();

  const {
    initiateTransaction,
    transactionHash,
    transactionStatus,
    transactionReceipt,
    transactionIsLoading,
    transactionIsSuccess,
    transactionIsError,
    transactionError,
  } = useWriteContractWithReceipt({
    chain: basenameChain,
    eventName: 'basename_accept_ownership',
  });

  const acceptOwnership = useCallback(async () => {
    const contractAddress = UPGRADEABLE_REGISTRAR_CONTROLLER_ADDRESSES[basenameChain.id];
    
    if (!contractAddress) {
      throw new Error(`Contract address not found for chain ${basenameChain.id}`);
    }

    const contractParameters: ContractFunctionParameters = {
      address: contractAddress,
      abi: UpgradeableRegistrarControllerAbi,
      functionName: 'acceptOwnership',
      args: [],
    };

    await initiateTransaction(contractParameters);
  }, [basenameChain.id, initiateTransaction]);

  return {
    acceptOwnership,
    transactionHash,
    transactionStatus,
    transactionReceipt,
    transactionIsLoading,
    transactionIsSuccess,
    transactionIsError,
    transactionError,
  };
}

export { WriteTransactionWithReceiptStatus };
