import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';
import { hashPassword, prismaClient } from '~/utils/prisma';
import { Login } from '~/components/Login';
import { useAppSession } from '~/utils/session';
import { z } from 'zod';

/**
 * Handles the login functionality for the application.
 *
 * this is a server function that has a formData and context as a parameter
 *
 * @param {FormData} formData - The form data containing the user's email and password.
 * @param {Object} context - The context object containing the request.
 * @param {Request} context.request - The HTTP request object.
 *
 * @returns {Promise<Object>} - A promise that resolves to an object containing the login result.
 *
 * The returned object can have the following properties:
 * - `error` (boolean): Indicates if there was an error during login.
 * - `userNotFound` (boolean): Indicates if the user was not found.
 * - `message` (string): A message describing the result of the login attempt.
 *
 * The function performs the following steps:
 * 1. Retrieves the email and password from the form data.
 * 2. Searches for the user in the database using the provided email.
 * 3. If the user is not found, returns an error object indicating the user was not found.
 * 4. If the user is found, hashes the provided password and compares it with the stored hashed password.
 * 5. If the passwords do not match, returns an error object indicating an incorrect password.
 * 6. If the passwords match, creates a session and stores the user's email and role in the session.
 */
export const loginFn = createServerFn('POST', async (formData: FormData, { request }) => {
  // get the form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Find the user
  const found = await prismaClient.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      email: true,
      password: true,
      role: true,
    },
  });

  // Check if the user exists
  if (!found) {
    return {
      error: true,
      userNotFound: true,
      message: 'User not found',
    };
  }

  // Check if the password is correct
  const hashedPassword = await hashPassword(password);

  if (found.password !== hashedPassword) {
    return {
      error: true,
      message: 'Incorrect password',
    };
  }

  // Create a session
  const session = await useAppSession();

  // Store the user's email in the session
  await session.update({
    email: found.email,
    role: found.role,
    id: found.id,
  });

  // Redirect to posts page after successful login
  throw redirect({
    to: '/home',
    statusCode: 301,
  });
});

/**
 * Handles user signup by creating a new user in the database and initiating a session.
 *
 * this is a server function that has a specific payload of email, password, and redirectUrl
 *
 * @param payload - The signup payload containing user details.
 * @param payload.email - The email address of the user.
 * @param payload.password - The password of the user.
 * @param payload.redirectUrl - Optional URL to redirect after signup.
 *
 * @returns An object indicating whether an error occurred and if the user already exists.
 *
 * @throws Redirects to the specified URL or the root URL after successful signup.
 */
export const signupFn = createServerFn(
  'POST',
  async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    redirectUrl?: string;
  }) => {
    // Check if the user already exists
    const found = await prismaClient.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (found) {
      return {
        error: true,
        userExists: true,
        message: 'User already exists',
      };
    }

    // Validate the input with zod
    const signupSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      redirectUrl: z.string().optional(),
    });

    const result = signupSchema.safeParse(payload);

    if (!result.success) {
      return {
        error: true,
        message: 'Invalid input',
        issues: result.error.issues as z.ZodIssue[],
      };
    }

    // Encrypt the password using Sha256 into plaintext
    const hashedPassword = await hashPassword(payload.password);

    // Create the user
    const user = await prismaClient.user.create({
      data: {
        email: result.data.email,
        password: hashedPassword,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
      },
    });

    // Create a session
    const session = await useAppSession();

    // Store the user's email in the session alomg with the user role
    // and the user id
    await session.update({
      email: payload.email,
      role: user.role || 'user',
      id: user.id,
    });

    // Redirect to the prev page stored in the "redirect" search param
    throw redirect({
      to: payload.redirectUrl || '/',
      statusCode: 301,
    });
  }
);

/**
 * Fetches the user information from the server.
 *
 * This function performs a GET request to retrieve the user's email
 * from the server-side session. It ensures that the user is authenticated
 * by checking the session data for a user email.
 *
 * @returns {Promise<{ email: string } | null>} An object containing the user's email if authenticated, otherwise null.
 */
export const fetchSessionUser = createServerFn('GET', async () => {
  // We need to auth on the server so we have access to secure cookies
  const session = await useAppSession();

  if (!session.data.email) {
    return null;
  }

  return {
    ...session.data,
  };
});

/**
 * Retrieves the current authenticated user from the session, and then fetches the
 * user's details from the database.
 *
 * @async
 * @function getCurrentUser
 * @returns {Promise<Object>} The current user's details including email, role, and id.
 * @throws {Error} If the user is not authenticated.
 */
export const getCurrentUser = createServerFn('GET', async () => {
  const session = await useAppSession();

  if (!session.data.email) {
    throw new Error('Not authenticated');
  }

  const user = await prismaClient.user.findUnique({
    where: {
      email: session.data.email,
    },
    select: {
      id: true,
      email: true,
      role: true,
      first_name: true,
      last_name: true,
    },
  });

  return user;
});

/**
 * Route, and child routes that requires authentication.
 * also note the that route prefaced with the underscore character is not
 * included in the path of the child routes.
 *
 * If the user is not authenticated, the user is redirected to the login page.
 */
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context }) => {
    if (!context.user) {
      // Redirect to the home page if the user is not authenticated
      return redirect({
        to: '/',
        statusCode: 301,
      });
    }
  },
  errorComponent: ({ error }) => {
    if (error.message === 'Not authenticated') {
      return <Login />;
    }

    throw error;
  },
});
