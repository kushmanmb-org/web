/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useAcceptOwnership, WriteTransactionWithReceiptStatus } from './useAcceptOwnership';
import { base } from 'viem/chains';

// Mock useWriteContractWithReceipt
const mockInitiateTransaction = jest.fn();
const mockUseWriteContractWithReceipt = jest.fn();

jest.mock('apps/web/src/hooks/useWriteContractWithReceipt', () => ({
  __esModule: true,
  default: () => mockUseWriteContractWithReceipt(),
  WriteTransactionWithReceiptStatus: {
    Idle: 'idle',
    Initiated: 'initiated',
    Canceled: 'canceled',
    Approved: 'approved',
    Processing: 'processing',
    Reverted: 'reverted',
    Success: 'success',
  },
}));

// Mock useBasenameChain
jest.mock('apps/web/src/hooks/useBasenameChain', () => ({
  __esModule: true,
  default: () => ({ basenameChain: base }),
}));

describe('useAcceptOwnership', () => {
  const mockTransactionHash = '0xabc123' as `0x${string}`;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWriteContractWithReceipt.mockReturnValue({
      initiateTransaction: mockInitiateTransaction,
      transactionHash: undefined,
      transactionStatus: WriteTransactionWithReceiptStatus.Idle,
      transactionReceipt: undefined,
      transactionIsLoading: false,
      transactionIsSuccess: false,
      transactionIsError: false,
      transactionError: null,
    });
  });

  it('should initialize with idle state', () => {
    const { result } = renderHook(() => useAcceptOwnership());

    expect(result.current.transactionStatus).toBe(WriteTransactionWithReceiptStatus.Idle);
    expect(result.current.transactionIsLoading).toBe(false);
    expect(result.current.transactionIsSuccess).toBe(false);
    expect(result.current.transactionIsError).toBe(false);
  });

  it('should call acceptOwnership with correct contract parameters', async () => {
    mockInitiateTransaction.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAcceptOwnership());

    await result.current.acceptOwnership();

    expect(mockInitiateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        abi: expect.any(Array),
        functionName: 'acceptOwnership',
        args: [],
      }),
    );
  });

  it('should handle transaction success', async () => {
    mockUseWriteContractWithReceipt.mockReturnValue({
      initiateTransaction: mockInitiateTransaction,
      transactionHash: mockTransactionHash,
      transactionStatus: WriteTransactionWithReceiptStatus.Success,
      transactionReceipt: { status: 'success' },
      transactionIsLoading: false,
      transactionIsSuccess: true,
      transactionIsError: false,
      transactionError: null,
    });

    const { result } = renderHook(() => useAcceptOwnership());

    expect(result.current.transactionIsSuccess).toBe(true);
    expect(result.current.transactionHash).toBe(mockTransactionHash);
  });

  it('should handle transaction error', async () => {
    const mockError = new Error('Transaction failed');
    mockUseWriteContractWithReceipt.mockReturnValue({
      initiateTransaction: mockInitiateTransaction,
      transactionHash: undefined,
      transactionStatus: WriteTransactionWithReceiptStatus.Idle,
      transactionReceipt: undefined,
      transactionIsLoading: false,
      transactionIsSuccess: false,
      transactionIsError: true,
      transactionError: mockError,
    });

    const { result } = renderHook(() => useAcceptOwnership());

    expect(result.current.transactionIsError).toBe(true);
    expect(result.current.transactionError).toBe(mockError);
  });

  it('should handle loading state', async () => {
    mockUseWriteContractWithReceipt.mockReturnValue({
      initiateTransaction: mockInitiateTransaction,
      transactionHash: mockTransactionHash,
      transactionStatus: WriteTransactionWithReceiptStatus.Processing,
      transactionReceipt: undefined,
      transactionIsLoading: true,
      transactionIsSuccess: false,
      transactionIsError: false,
      transactionError: null,
    });

    const { result } = renderHook(() => useAcceptOwnership());

    expect(result.current.transactionIsLoading).toBe(true);
    expect(result.current.transactionStatus).toBe(WriteTransactionWithReceiptStatus.Processing);
  });

  it('should handle error when contract address is not found', async () => {
    // When acceptOwnership is called with an invalid chain, it should throw
    mockInitiateTransaction.mockRejectedValue(
      new Error('Contract address not found for chain 99999')
    );

    const { result } = renderHook(() => useAcceptOwnership());

    await expect(result.current.acceptOwnership()).rejects.toThrow(
      'Contract address not found for chain 99999'
    );
  });
});
