/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AcceptOwnershipBanner from './index';
import { WriteTransactionWithReceiptStatus } from 'apps/web/src/hooks/useAcceptOwnership';

// Mock the hooks
const mockUsePendingOwnerStatus = jest.fn();
const mockUseAcceptOwnership = jest.fn();

jest.mock('apps/web/src/hooks/usePendingOwnerStatus', () => ({
  usePendingOwnerStatus: () => mockUsePendingOwnerStatus(),
}));

jest.mock('apps/web/src/hooks/useAcceptOwnership', () => ({
  useAcceptOwnership: () => mockUseAcceptOwnership(),
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

// Mock WalletIdentity component
jest.mock('apps/web/src/components/WalletIdentity', () => {
  return function MockWalletIdentity({ address }: { address: string }) {
    return <div data-testid="wallet-identity">{address}</div>;
  };
});

describe('AcceptOwnershipBanner', () => {
  const mockCurrentOwner = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const;
  const mockAcceptOwnership = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: false,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockUseAcceptOwnership.mockReturnValue({
      acceptOwnership: mockAcceptOwnership,
      transactionStatus: WriteTransactionWithReceiptStatus.Idle,
      transactionIsLoading: false,
      transactionIsSuccess: false,
      transactionIsError: false,
      transactionError: null,
    });
  });

  it('should not render when user is not pending owner', () => {
    const { container } = render(<AcceptOwnershipBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when loading', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: false,
      currentOwner: mockCurrentOwner,
      isLoading: true,
    });

    const { container } = render(<AcceptOwnershipBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render banner when user is pending owner', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    render(<AcceptOwnershipBanner />);

    expect(screen.getByText('Pending Ownership Transfer')).toBeInTheDocument();
    expect(
      screen.getByText(/You have been designated as the pending owner/i),
    ).toBeInTheDocument();
    expect(screen.getByText('Accept Ownership')).toBeInTheDocument();
  });

  it('should display current owner address', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    render(<AcceptOwnershipBanner />);

    expect(screen.getByText('Current owner:')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-identity')).toHaveTextContent(mockCurrentOwner);
  });

  it('should call acceptOwnership when button is clicked', async () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockAcceptOwnership.mockResolvedValue(undefined);

    render(<AcceptOwnershipBanner />);

    const button = screen.getByText('Accept Ownership');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockAcceptOwnership).toHaveBeenCalledTimes(1);
    });
  });

  it('should disable button when transaction is processing', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockUseAcceptOwnership.mockReturnValue({
      acceptOwnership: mockAcceptOwnership,
      transactionStatus: WriteTransactionWithReceiptStatus.Processing,
      transactionIsLoading: true,
      transactionIsSuccess: false,
      transactionIsError: false,
      transactionError: null,
    });

    render(<AcceptOwnershipBanner />);

    const button = screen.getByText('Processing...');
    expect(button).toBeDisabled();
  });

  it('should display error message when transaction fails', () => {
    const mockError = new Error('Transaction failed');
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockUseAcceptOwnership.mockReturnValue({
      acceptOwnership: mockAcceptOwnership,
      transactionStatus: WriteTransactionWithReceiptStatus.Idle,
      transactionIsLoading: false,
      transactionIsSuccess: false,
      transactionIsError: true,
      transactionError: mockError,
    });

    render(<AcceptOwnershipBanner />);

    expect(screen.getByText('Error accepting ownership')).toBeInTheDocument();
    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
  });

  it('should not render after successful transaction', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockUseAcceptOwnership.mockReturnValue({
      acceptOwnership: mockAcceptOwnership,
      transactionStatus: WriteTransactionWithReceiptStatus.Success,
      transactionIsLoading: false,
      transactionIsSuccess: true,
      transactionIsError: false,
      transactionError: null,
    });

    const { container } = render(<AcceptOwnershipBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should show transaction status', () => {
    mockUsePendingOwnerStatus.mockReturnValue({
      isPendingOwner: true,
      currentOwner: mockCurrentOwner,
      isLoading: false,
    });

    mockUseAcceptOwnership.mockReturnValue({
      acceptOwnership: mockAcceptOwnership,
      transactionStatus: WriteTransactionWithReceiptStatus.Approved,
      transactionIsLoading: false,
      transactionIsSuccess: false,
      transactionIsError: false,
      transactionError: null,
    });

    render(<AcceptOwnershipBanner />);

    expect(screen.getByText(/Status: approved/i)).toBeInTheDocument();
  });
});
