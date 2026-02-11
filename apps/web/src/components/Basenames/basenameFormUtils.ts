import { useCallback } from 'react';

/**
 * Creates a callback to switch to a specific chain
 */
export function useSwitchToBasenameChain(
  switchChain: (params: { chainId: number }) => void,
  chainId: number,
) {
  return useCallback(() => switchChain({ chainId }), [chainId, switchChain]);
}

/**
 * Creates callbacks for incrementing and decrementing year selection
 */
export function useYearSelectionCallbacks(
  setYears: (fn: (n: number) => number) => void,
  options?: {
    onIncrement?: () => void;
    onDecrement?: () => void;
  },
) {
  const increment = useCallback(() => {
    options?.onIncrement?.();
    setYears((n) => n + 1);
  }, [setYears, options]);

  const decrement = useCallback(() => {
    options?.onDecrement?.();
    setYears((n) => (n > 1 ? n - 1 : n));
  }, [setYears, options]);

  return { increment, decrement };
}
