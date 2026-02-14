/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from './route';

// Helper function to create a mock NextRequest
function createMockRequest(body: unknown): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return request;
}

describe('POST /api/auth/register', () => {
  describe('Successful registration', () => {
    it('should register a user with valid data', async () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest(validData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        message: 'Registration successful',
        user: {
          username: 'testuser',
          email: 'test@example.com',
        },
      });
    });

    it('should trim username and email whitespace', async () => {
      const dataWithWhitespace = {
        username: '  testuser  ',
        email: '  test@example.com  ',
        password: 'password123',
      };

      const request = createMockRequest(dataWithWhitespace);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user.username).toBe('testuser');
      expect(data.user.email).toBe('test@example.com');
    });
  });

  describe('Password validation', () => {
    it('should reject password with leading whitespace', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '  password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password cannot have leading or trailing spaces');
    });

    it('should reject password with trailing whitespace', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123  ',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password cannot have leading or trailing spaces');
    });

    it('should reject password with both leading and trailing whitespace', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '  password123  ',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password cannot have leading or trailing spaces');
    });

    it('should allow password with spaces in the middle', async () => {
      const validData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'pass word 123',
      };

      const request = createMockRequest(validData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.message).toBe('Registration successful');
    });

    it('should reject password shorter than 8 characters', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'pass123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });

    it('should reject empty password', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject non-string password', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 12345678,
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Password must be at least 8 characters');
    });
  });

  describe('Username validation', () => {
    it('should reject username shorter than 3 characters', async () => {
      const invalidData = {
        username: 'ab',
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Username must be at least 3 characters');
    });

    it('should reject empty username', async () => {
      const invalidData = {
        username: '',
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject username with only whitespace', async () => {
      const invalidData = {
        username: '   ',
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email format', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should reject email without @', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'testexample.com',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should reject email without domain', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid email format');
    });

    it('should reject empty email', async () => {
      const invalidData = {
        username: 'testuser',
        email: '',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject email with only whitespace', async () => {
      const invalidData = {
        username: 'testuser',
        email: '   ',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });

  describe('Missing fields', () => {
    it('should reject request with missing username', async () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject request with missing email', async () => {
      const invalidData = {
        username: 'testuser',
        password: 'password123',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });

    it('should reject request with missing password', async () => {
      const invalidData = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const request = createMockRequest(invalidData);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields');
    });
  });
});
