/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

type ErrorResponse = { error: string };
type SuccessResponse = {
  message: string;
  connection: {
    username: string;
    walletAddress: string;
    connectedAt: string;
  };
};
type ConnectRouteResponse = SuccessResponse | ErrorResponse;

describe('/api/auth/connect route', () => {
  const validUsername = 'testuser';
  const validWalletAddress = '0x1234567890123456789012345678901234567890';

  describe('POST', () => {
    it('should return 400 when username is missing', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: validWalletAddress,
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 when walletAddress is missing', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 when both fields are missing', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Missing required fields' });
    });

    it('should return 400 when username is too short', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: 'ab',
          walletAddress: validWalletAddress,
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Username must be at least 3 characters' });
    });

    it('should return 400 when wallet address format is invalid', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: 'invalid-address',
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid wallet address format' });
    });

    it('should return 400 when wallet address is too short', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: '0x123',
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid wallet address format' });
    });

    it('should return 400 when wallet address does not start with 0x', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: '1234567890123456789012345678901234567890',
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as ConnectRouteResponse;

      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Invalid wallet address format' });
    });

    it('should return 201 for valid connection request', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: validWalletAddress,
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as SuccessResponse;

      expect(response.status).toBe(201);
      expect(data.message).toBe('Wallet connected successfully');
      expect(data.connection).toMatchObject({
        username: validUsername,
        walletAddress: validWalletAddress,
      });
      expect(data.connection.connectedAt).toBeDefined();
      expect(new Date(data.connection.connectedAt).getTime()).toBeGreaterThan(0);
    });

    it('should trim whitespace from username and walletAddress', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: '  testuser  ',
          walletAddress: '  0x1234567890123456789012345678901234567890  ',
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as SuccessResponse;

      expect(response.status).toBe(201);
      expect(data.connection.username).toBe('testuser');
      expect(data.connection.walletAddress).toBe('0x1234567890123456789012345678901234567890');
    });

    it('should accept optional signature parameter', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: validWalletAddress,
          signature: '0xabcdef',
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as SuccessResponse;

      expect(response.status).toBe(201);
      expect(data.message).toBe('Wallet connected successfully');
    });

    it('should handle lowercase and uppercase hex characters in wallet address', async () => {
      const mixedCaseAddress = '0xAbCdEf1234567890123456789012345678901234';
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: JSON.stringify({
          username: validUsername,
          walletAddress: mixedCaseAddress,
        }),
      });

      const response = await POST(request);
      const data = (await response.json()) as SuccessResponse;

      expect(response.status).toBe(201);
      expect(data.connection.walletAddress).toBe(mixedCaseAddress);
    });

    it('should return 500 for malformed JSON', async () => {
      const request = new NextRequest('https://www.base.org/api/auth/connect', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await POST(request);
      const data = (await response.json()) as ErrorResponse;

      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Internal server error' });
    });
  });
});
