/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { usePendingOwnerStatus } from './usePendingOwnerStatus';
import { base, baseSepolia } from 'viem/chains';

// Mock wagmi hooks
const mockUseAccount = jest.fn();
const mockUseReadContract = jest.fn();

jest.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useReadContract: (args: unknown) => mockUseReadContract(args),
}));

// Mock useBasenameChain
jest.mock('apps/web/src/hooks/useBasenameChain', () => ({
  __esModule: true,
  default: () => ({ basenameChain: base }),
}));

describe('usePendingOwnerStatus', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockPendingOwner = '0x1234567890123456789012345678901234567890' as const;
  const mockCurrentOwner = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAccount.mockReturnValue({ address: mockAddress });
  });

  it('should return isPendingOwner as true when address matches pendingOwner', () => {
    let callCount = 0;
    mockUseReadContract.mockImplementation(() => {
      callCount++;
      // First call is for pendingOwner, second is for owner
      if (callCount === 1) {
        return { data: mockPendingOwner, isLoading: false };
      }
      return { data: mockCurrentOwner, isLoading: false };
    });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isPendingOwner).toBe(true);
    expect(result.current.pendingOwner).toBe(mockPendingOwner);
    expect(result.current.currentOwner).toBe(mockCurrentOwner);
    expect(result.current.isLoading).toBe(false);
  });

  it('should return isPendingOwner as false when address does not match pendingOwner', () => {
    const differentAddress = '0xdifferent1234567890123456789012345678901234' as const;
    mockUseAccount.mockReturnValue({ address: mockAddress });

    let callCount = 0;
    mockUseReadContract.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: differentAddress, isLoading: false };
      }
      return { data: mockCurrentOwner, isLoading: false };
    });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isPendingOwner).toBe(false);
    expect(result.current.pendingOwner).toBe(differentAddress);
  });

  it('should return isPendingOwner as false when there is no pending owner', () => {
    let callCount = 0;
    mockUseReadContract.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: undefined, isLoading: false };
      }
      return { data: mockCurrentOwner, isLoading: false };
    });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isPendingOwner).toBe(false);
    expect(result.current.pendingOwner).toBeUndefined();
  });

  it('should handle loading state correctly', () => {
    mockUseReadContract.mockReturnValue({ data: undefined, isLoading: true });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isLoading).toBe(true);
  });

  it('should return isPendingOwner as false when user is not connected', () => {
    mockUseAccount.mockReturnValue({ address: undefined });
    mockUseReadContract.mockReturnValue({ data: mockPendingOwner, isLoading: false });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isPendingOwner).toBe(false);
  });

  it('should compare addresses case-insensitively', () => {
    const upperCasePendingOwner = mockPendingOwner.toUpperCase() as `0x${string}`;
    
    let callCount = 0;
    mockUseReadContract.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return { data: upperCasePendingOwner, isLoading: false };
      }
      return { data: mockCurrentOwner, isLoading: false };
    });

    const { result } = renderHook(() => usePendingOwnerStatus());

    expect(result.current.isPendingOwner).toBe(true);
  });
});
