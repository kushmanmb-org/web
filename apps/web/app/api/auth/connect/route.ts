import { NextRequest, NextResponse } from 'next/server';

type ConnectWalletBody = {
  username: string;
  walletAddress: string;
  signature?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConnectWalletBody;

    // Trim whitespace from username and walletAddress
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const walletAddress = typeof body.walletAddress === 'string' ? body.walletAddress.trim() : '';

    // Validate required fields
    if (!username || !walletAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate username length
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Validate wallet address format (basic Ethereum address validation)
    const ethereumAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethereumAddressRegex.test(walletAddress)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    // TODO: In a real application, you would:
    // 1. Verify the signature to ensure the user owns the wallet
    // 2. Check if the user exists in the database
    // 3. Check if the wallet is already connected to another account
    // 4. Store the wallet connection in the database
    // 5. Update the user's session

    // For now, we'll just simulate a successful connection
    // This is a placeholder implementation
    console.log('Wallet connection attempt:', { 
      username: username.substring(0, 3) + '***', 
      walletAddress: walletAddress.substring(0, 6) + '...' + walletAddress.substring(38),
    });

    return NextResponse.json(
      {
        message: 'Wallet connected successfully',
        connection: {
          username,
          walletAddress,
          connectedAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Wallet connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
