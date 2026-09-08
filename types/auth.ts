import type { Role } from './api';

export interface UserPayload {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: Role;
  isVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PasetoPayload {
  sub: string;
  email: string;
  name: string;
  role: Role;
  iss: string;
  aud: string;
  iat: string;
  exp: string;
}

export interface AuthSession {
  user: UserPayload;
  accessToken: string;
  expiresAt: string;
}

export interface AddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
  avatarUrl?: string;
}

