import { NextRequest, NextResponse } from 'next/server';
import { logger } from 'apps/web/src/utils/logger';

export type HelpRequestData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
};

export type HelpRequestResponse = {
  success: boolean;
  message: string;
};

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    let body: HelpRequestData;

    try {
      body = (await request.json()) as HelpRequestData;
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body' },
        { status: 400 },
      );
    }

    const { name, email, subject, message, category } = body;

    // Validate required fields and trim whitespace
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim();
    const trimmedSubject = subject?.trim();
    const trimmedMessage = message?.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 },
      );
    }

    // Validate field lengths
    if (trimmedName.length > 100) {
      return NextResponse.json(
        { success: false, message: 'Name must not exceed 100 characters' },
        { status: 400 },
      );
    }

    if (trimmedEmail.length > 255) {
      return NextResponse.json(
        { success: false, message: 'Email must not exceed 255 characters' },
        { status: 400 },
      );
    }

    if (trimmedSubject.length > 200) {
      return NextResponse.json(
        { success: false, message: 'Subject must not exceed 200 characters' },
        { status: 400 },
      );
    }

    // Validate email format
    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 },
      );
    }

    // Validate message length
    if (trimmedMessage.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Message must be at least 10 characters long' },
        { status: 400 },
      );
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { success: false, message: 'Message must not exceed 5000 characters' },
        { status: 400 },
      );
    }

    // Log the help request (without PII)
    logger.info('Help request received', {
      nameLength: trimmedName.length,
      emailDomain: trimmedEmail.split('@')[1] || 'unknown',
      subject: trimmedSubject,
      category,
      messageLength: trimmedMessage.length,
    });

    // In a real implementation, you would:
    // 1. Store the request in a database
    // 2. Send an email notification to support team
    // 3. Send a confirmation email to the user
    // For now, we'll just log it and return success

    const response: HelpRequestResponse = {
      success: true,
      message: 'Your help request has been submitted successfully. We will get back to you soon.',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('Error processing help request:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process help request' },
      { status: 500 },
    );
  }
}
