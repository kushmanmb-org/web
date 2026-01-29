import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// ABI for MultiSigWallet contract
const MULTISIG_ABI = [
  'function execute(address _to, uint256 _value, bytes memory _data) external returns (bytes32)',
  'function confirm(bytes32 _operation) external returns (bool)',
  'function revoke(bytes32 _operation) external',
  'function addOwner(address _owner) external',
  'function removeOwner(address _owner) external',
  'function changeOwner(address _from, address _to) external',
  'function changeRequirement(uint256 _newRequired) external',
  'function setDailyLimit(uint256 _newLimit) external',
  'function resetSpentToday() external',
  'function isOwner(address _owner) external view returns (bool)',
  'function hasConfirmed(bytes32 _operation, address _owner) external view returns (bool)',
  'function getPendingTransactions() external view returns (bytes32[])',
  'function getOwners() external view returns (address[])',
  'function m_required() external view returns (uint256)',
  'function m_numOwners() external view returns (uint256)',
  'function m_dailyLimit() external view returns (uint256)',
  'function spentToday() external view returns (uint256)',
  'event Deposit(address indexed sender, uint256 value)',
  'event Confirmation(address indexed owner, bytes32 indexed operation)',
  'event Revoke(address indexed owner, bytes32 indexed operation)',
  'event OwnerAdded(address indexed newOwner)',
  'event OwnerRemoved(address indexed oldOwner)',
  'event OwnerChanged(address indexed oldOwner, address indexed newOwner)',
  'event RequirementChanged(uint256 newRequirement)',
  'event SingleTransact(address indexed owner, uint256 value, address indexed to, bytes data)',
  'event MultiTransact(address indexed owner, bytes32 indexed operation, uint256 value, address indexed to, bytes data)',
  'event ConfirmationNeeded(bytes32 indexed operation, address indexed initiator, uint256 value, address indexed to, bytes data)',
];

interface Transaction {
  hash: string;
  to: string;
  value: string;
  data: string;
  confirmations: number;
  hasConfirmed: boolean;
}

interface MultiSigWalletProps {
  contractAddress: string;
}

export default function MultiSigWallet({ contractAddress }: MultiSigWalletProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [owners, setOwners] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [required, setRequired] = useState<number>(0);
  const [dailyLimit, setDailyLimit] = useState<string>('0');
  const [spentToday, setSpentToday] = useState<string>('0');
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form states
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [txData, setTxData] = useState<string>('0x');
  const [newOwnerAddress, setNewOwnerAddress] = useState<string>('');
  const [newRequirement, setNewRequirement] = useState<string>('');
  const [newDailyLimit, setNewDailyLimit] = useState<string>('');

  // Initialize contract
  useEffect(() => {
    if (walletClient && contractAddress) {
      const provider = new ethers.BrowserProvider(walletClient as any);
      provider.getSigner().then((signer) => {
        const multiSigContract = new ethers.Contract(contractAddress, MULTISIG_ABI, signer);
        setContract(multiSigContract);
      });
    }
  }, [walletClient, contractAddress]);

  // Load wallet data
  const loadWalletData = useCallback(async () => {
    if (!contract || !address) return;

    try {
      setLoading(true);
      const provider = contract.runner?.provider;
      if (!provider) return;

      // Get balance
      const walletBalance = await provider.getBalance(contractAddress);
      setBalance(ethers.formatEther(walletBalance));

      // Get owners
      const ownersList = await contract.getOwners();
      setOwners(ownersList);

      // Check if current user is owner
      const ownerStatus = await contract.isOwner(address);
      setIsOwner(ownerStatus);

      // Get required confirmations
      const requiredConfirms = await contract.m_required();
      setRequired(Number(requiredConfirms));

      // Get daily limit
      const limit = await contract.m_dailyLimit();
      setDailyLimit(ethers.formatEther(limit));

      // Get spent today
      const spent = await contract.spentToday();
      setSpentToday(ethers.formatEther(spent));

      // Get pending transactions
      const pendingHashes = await contract.getPendingTransactions();
      const txs: Transaction[] = [];
      
      for (const hash of pendingHashes) {
        const hasConfirmed = await contract.hasConfirmed(hash, address);
        txs.push({
          hash,
          to: '',
          value: '',
          data: '',
          confirmations: 0,
          hasConfirmed,
        });
      }
      setPendingTxs(txs);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
      console.error('Error loading wallet data:', err);
    } finally {
      setLoading(false);
    }
  }, [contract, address, contractAddress]);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Execute transaction
  const executeTransaction = async () => {
    if (!contract || !recipient || !amount) return;

    try {
      setLoading(true);
      setError('');

      const value = ethers.parseEther(amount);
      const tx = await contract.execute(recipient, value, txData);
      await tx.wait();

      alert('Transaction executed successfully!');
      await loadWalletData();
      
      // Reset form
      setRecipient('');
      setAmount('');
      setTxData('0x');
    } catch (err: any) {
      setError(err.message || 'Failed to execute transaction');
      console.error('Error executing transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Confirm transaction
  const confirmTransaction = async (operationHash: string) => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.confirm(operationHash);
      await tx.wait();

      alert('Transaction confirmed!');
      await loadWalletData();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm transaction');
      console.error('Error confirming transaction:', err);
    } finally {
      setLoading(false);
    }
  };

  // Revoke confirmation
  const revokeConfirmation = async (operationHash: string) => {
    if (!contract) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.revoke(operationHash);
      await tx.wait();

      alert('Confirmation revoked!');
      await loadWalletData();
    } catch (err: any) {
      setError(err.message || 'Failed to revoke confirmation');
      console.error('Error revoking confirmation:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add owner
  const addOwner = async () => {
    if (!contract || !newOwnerAddress) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.addOwner(newOwnerAddress);
      await tx.wait();

      alert('Add owner proposal submitted!');
      await loadWalletData();
      setNewOwnerAddress('');
    } catch (err: any) {
      setError(err.message || 'Failed to add owner');
      console.error('Error adding owner:', err);
    } finally {
      setLoading(false);
    }
  };

  // Change requirement
  const changeRequirement = async () => {
    if (!contract || !newRequirement) return;

    try {
      setLoading(true);
      setError('');

      const tx = await contract.changeRequirement(parseInt(newRequirement));
      await tx.wait();

      alert('Change requirement proposal submitted!');
      await loadWalletData();
      setNewRequirement('');
    } catch (err: any) {
      setError(err.message || 'Failed to change requirement');
      console.error('Error changing requirement:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set daily limit
  const setDailyLimitFn = async () => {
    if (!contract || !newDailyLimit) return;

    try {
      setLoading(true);
      setError('');

      const limit = ethers.parseEther(newDailyLimit);
      const tx = await contract.setDailyLimit(limit);
      await tx.wait();

      alert('Set daily limit proposal submitted!');
      await loadWalletData();
      setNewDailyLimit('');
    } catch (err: any) {
      setError(err.message || 'Failed to set daily limit');
      console.error('Error setting daily limit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">MultiSig Wallet</h1>
          <p className="text-gray-600 mb-6">Connect your wallet to continue</p>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">MultiSig Wallet</h1>
            <ConnectButton />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Wallet Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Balance</h3>
              <p className="text-2xl font-bold text-blue-600">{balance} ETH</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Required</h3>
              <p className="text-2xl font-bold text-green-600">{required} of {owners.length}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Daily Limit</h3>
              <p className="text-2xl font-bold text-purple-600">{dailyLimit} ETH</p>
              <p className="text-sm text-gray-600">Spent: {spentToday} ETH</p>
            </div>
          </div>

          {!isOwner && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-4">
              You are not an owner of this wallet
            </div>
          )}
        </div>

        {isOwner && (
          <>
            {/* New Transaction */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">New Transaction</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (ETH)
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data (optional)
                  </label>
                  <input
                    type="text"
                    value={txData}
                    onChange={(e) => setTxData(e.target.value)}
                    placeholder="0x"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={executeTransaction}
                  disabled={loading || !recipient || !amount}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Execute Transaction'}
                </button>
              </div>
            </div>

            {/* Pending Transactions */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Pending Transactions</h2>
              {pendingTxs.length === 0 ? (
                <p className="text-gray-500">No pending transactions</p>
              ) : (
                <div className="space-y-4">
                  {pendingTxs.map((tx) => (
                    <div key={tx.hash} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm text-gray-600 break-all">
                            <span className="font-medium">Hash:</span> {tx.hash}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!tx.hasConfirmed ? (
                          <button
                            onClick={() => confirmTransaction(tx.hash)}
                            disabled={loading}
                            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                          >
                            Confirm
                          </button>
                        ) : (
                          <button
                            onClick={() => revokeConfirmation(tx.hash)}
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner Management */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Owner Management</h2>
              
              {/* Current Owners */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Current Owners</h3>
                <div className="space-y-2">
                  {owners.map((owner, index) => (
                    <div key={owner} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm font-mono">{owner}</span>
                      {owner.toLowerCase() === address?.toLowerCase() && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Owner */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Add Owner</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newOwnerAddress}
                    onChange={(e) => setNewOwnerAddress(e.target.value)}
                    placeholder="0x..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addOwner}
                    disabled={loading || !newOwnerAddress}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Change Requirement */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Change Required Confirmations</h3>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder={required.toString()}
                    min="1"
                    max={owners.length}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={changeRequirement}
                    disabled={loading || !newRequirement}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Change Daily Limit */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Change Daily Limit</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDailyLimit}
                    onChange={(e) => setNewDailyLimit(e.target.value)}
                    placeholder={dailyLimit}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={setDailyLimitFn}
                    disabled={loading || !newDailyLimit}
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Set
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
