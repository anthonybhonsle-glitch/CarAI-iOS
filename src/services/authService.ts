/**
 * Client-side Authentication and Driver Identity Service
 * Enforces strict mobile-number-first registration, passwordless authentication (SMS/OTP verification),
 * and cloud-synced storage for driver profiles.
 */

import {
  sendMobileVerificationOtp,
  verifyMobileOtpAndLoginApi,
  fetchCloudDriverProfile,
  syncCloudDriverProfile,
} from './apiClient';

export interface AuthUser {
  id: string;
  userId: string;
  mobileNumber: string;
  countryCode: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  registeredAt: string;
  lastLoginAt?: string;
  token: string;
  isPro: boolean;
  planType: 'free' | 'pro_monthly' | 'pro_biannual' | 'pro_annual';
  status?: 'active_trial' | 'active_subscription' | 'trial_expired' | 'free_tier';
  freeRendersUsed: number;
  freeRendersLimit: number;
  trialExpiresAt?: string | null;
  preferredVehicle?: string;
  storageModel?: 'cloud_synced_vault';
}

const SESSION_TOKEN_KEY = 'carai_auth_session_token_v3';
const SESSION_CACHE_KEY = 'carai_auth_session_cache_v3';

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: Array<(user: AuthUser | null) => void> = [];
  private isSyncingWithCloud: boolean = false;

  constructor() {
    this.loadSession();
  }

  /**
   * Loads cached session token and hydrates profile directly from cloud
   */
  private loadSession(): void {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem(SESSION_CACHE_KEY);
      if (cached) {
        this.currentUser = JSON.parse(cached);
      } else {
        // Default initialized driver in cloud-synced storage
        this.currentUser = {
          id: 'demo_driver_01',
          userId: 'demo_driver_01',
          email: 'driver@carai.io',
          mobileNumber: '+1 (555) 839-2041',
          countryCode: '+1',
          fullName: 'Alex Vance',
          isVerified: true,
          registeredAt: new Date().toISOString(),
          token: 'jwt_sec_demo_9382',
          isPro: false,
          planType: 'free',
          status: 'free_tier',
          freeRendersUsed: 0,
          freeRendersLimit: 1,
          storageModel: 'cloud_synced_vault',
        };
        this.saveLocalCache();
      }

      // Automatically background-sync with cloud backend
      this.syncWithCloud();
    } catch (_) {
      this.currentUser = null;
    }
  }

  private saveLocalCache(): void {
    if (typeof window === 'undefined') return;
    if (this.currentUser) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(this.currentUser));
      localStorage.setItem(SESSION_TOKEN_KEY, this.currentUser.token || this.currentUser.userId);
    } else {
      localStorage.removeItem(SESSION_CACHE_KEY);
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
    this.notify();
  }

  public subscribe(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notify(): void {
    for (const l of this.listeners) {
      l(this.currentUser);
    }
  }

  public getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  public getCurrentSession(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Synchronizes user profile with remote cloud vault
   */
  public async syncWithCloud(): Promise<AuthUser | null> {
    if (!this.currentUser || this.isSyncingWithCloud) return this.currentUser;
    this.isSyncingWithCloud = true;

    try {
      const identifier = this.currentUser.userId || this.currentUser.id;
      const cloudProfile = await fetchCloudDriverProfile(identifier);
      if (cloudProfile) {
        this.currentUser = {
          ...this.currentUser,
          ...cloudProfile,
          storageModel: 'cloud_synced_vault',
        };
        this.saveLocalCache();
      }
    } catch (err) {
      console.warn('[AuthService] Cloud sync fallback to local cache:', err);
    } finally {
      this.isSyncingWithCloud = false;
    }

    return this.currentUser;
  }

  /**
   * Step 1: Send SMS OTP Code to Mobile Number
   */
  public async requestOtp(params: {
    mobileNumber: string;
    countryCode: string;
  }): Promise<{ success: boolean; message?: string; debugOtp?: string; error?: string }> {
    const { mobileNumber, countryCode } = params;
    const cleanDigits = mobileNumber.replace(/\D/g, '');

    if (!cleanDigits || cleanDigits.length < 7) {
      return {
        success: false,
        error: 'Please provide a valid mobile phone number with at least 7 digits.',
      };
    }

    try {
      const res = await sendMobileVerificationOtp(mobileNumber, countryCode);
      return {
        success: true,
        message: res.message,
        debugOtp: res.debugOtp,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to dispatch verification SMS.',
      };
    }
  }

  /**
   * Step 2: Passwordless Mobile-First Verification & Login/Registration
   */
  public async verifyMobileAndAuthenticate(params: {
    mobileNumber: string;
    countryCode: string;
    otpCode: string;
    fullName?: string;
    email?: string;
    preferredVehicle?: string;
  }): Promise<{ success: boolean; user?: AuthUser; isNewUser?: boolean; error?: string }> {
    const { mobileNumber, countryCode, otpCode, fullName, email, preferredVehicle } = params;

    const cleanDigits = mobileNumber.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 7) {
      return { success: false, error: 'Valid compulsory mobile phone number required.' };
    }

    if (!otpCode || otpCode.trim().length < 4) {
      return { success: false, error: 'Please enter the 6-digit SMS verification code.' };
    }

    try {
      const result = await verifyMobileOtpAndLoginApi({
        mobileNumber,
        countryCode,
        otpCode: otpCode.trim(),
        fullName,
        email,
        preferredVehicle,
      });

      if (!result.success || !result.user) {
        return { success: false, error: 'Mobile verification failed.' };
      }

      const authenticatedUser: AuthUser = {
        ...result.user,
        userId: result.user.userId || result.user.id,
        storageModel: 'cloud_synced_vault',
      };

      this.currentUser = authenticatedUser;
      this.saveLocalCache();

      return {
        success: true,
        user: authenticatedUser,
        isNewUser: result.isNewUser,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Verification failed. Please check your SMS code.',
      };
    }
  }

  /**
   * Strict Mobile-First Registration (Passwordless)
   */
  public async register(params: {
    mobileNumber: string;
    countryCode: string;
    fullName: string;
    email?: string;
    otpCode?: string;
  }): Promise<{ success: boolean; error?: string; user?: AuthUser; debugOtp?: string }> {
    const { mobileNumber, countryCode, fullName, email, otpCode } = params;

    if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 7) {
      return {
        success: false,
        error: 'Mobile phone number is compulsory for account registration and vehicle pairing.',
      };
    }

    // If OTP provided, verify and register immediately
    if (otpCode) {
      const res = await this.verifyMobileAndAuthenticate({
        mobileNumber,
        countryCode,
        otpCode,
        fullName: fullName.trim() || 'Driver',
        email: email?.trim(),
      });
      return res;
    }

    // Otherwise send OTP first
    const otpRes = await this.requestOtp({ mobileNumber, countryCode });
    if (!otpRes.success) {
      return { success: false, error: otpRes.error };
    }

    return {
      success: true,
      debugOtp: otpRes.debugOtp,
    };
  }

  /**
   * Passwordless Mobile Login (via OTP code or instant verified phone handshake)
   */
  public async login(params: {
    mobileNumber: string;
    countryCode?: string;
    otpCode?: string;
  }): Promise<{ success: boolean; error?: string; user?: AuthUser; debugOtp?: string }> {
    const { mobileNumber, countryCode = '+1', otpCode } = params;

    if (!mobileNumber || mobileNumber.replace(/\D/g, '').length < 7) {
      return {
        success: false,
        error: 'Please enter your registered mobile phone number.',
      };
    }

    // If OTP code is supplied, perform verification
    if (otpCode) {
      return this.verifyMobileAndAuthenticate({
        mobileNumber,
        countryCode,
        otpCode,
      });
    }

    // If no OTP, request code
    const otpRes = await this.requestOtp({ mobileNumber, countryCode });
    if (!otpRes.success) {
      return { success: false, error: otpRes.error };
    }

    return {
      success: true,
      debugOtp: otpRes.debugOtp,
    };
  }

  /**
   * Updates user profile attributes in the cloud storage
   */
  public async updateProfile(updates: Partial<AuthUser>): Promise<AuthUser | null> {
    if (!this.currentUser) return null;

    try {
      const updatedCloudUser = await syncCloudDriverProfile(this.currentUser.userId, updates);
      this.currentUser = {
        ...this.currentUser,
        ...updatedCloudUser,
        storageModel: 'cloud_synced_vault',
      };
      this.saveLocalCache();
      return this.currentUser;
    } catch (err) {
      console.error('[AuthService] Failed to update cloud profile:', err);
      // Optimistic local update
      this.currentUser = { ...this.currentUser, ...updates };
      this.saveLocalCache();
      return this.currentUser;
    }
  }

  public logout(): void {
    this.currentUser = null;
    this.saveLocalCache();
  }

  public updateSubscription(
    isPro: boolean,
    planType: 'free' | 'pro_monthly' | 'pro_biannual' | 'pro_annual'
  ): void {
    if (this.currentUser) {
      this.currentUser.isPro = isPro;
      this.currentUser.planType = planType;
      this.currentUser.status = isPro ? 'active_subscription' : 'free_tier';
      this.saveLocalCache();
      this.updateProfile({ isPro, planType });
    }
  }

  public incrementUsage(): void {
    if (this.currentUser && !this.currentUser.isPro) {
      this.currentUser.freeRendersUsed = Math.min(
        this.currentUser.freeRendersLimit,
        this.currentUser.freeRendersUsed + 1
      );
      this.saveLocalCache();
      this.updateProfile({ freeRendersUsed: this.currentUser.freeRendersUsed });
    }
  }
}

export const authService = new AuthService();
