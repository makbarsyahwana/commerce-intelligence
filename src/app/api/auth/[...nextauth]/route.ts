/**
 * Auth.js v5 API Routes
 * 
 * Handles all authentication endpoints:
 * - /api/auth/signin
 * - /api/auth/signout  
 * - /api/auth/session
 * - /api/auth/providers
 * - /api/auth/callback/[...nextauth]
 */

import { handlers } from '../index';

export const { GET, POST } = handlers;
