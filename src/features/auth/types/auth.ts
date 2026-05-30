export type LoginUserType = "tenant" | "driver";

export type LoginCredentials = {
  email: string;
  password: string;
  userType: LoginUserType;
};

export type AuthUser = Record<string, any>;

export type LoginResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: AuthUser;
  mfa_required?: boolean;
  mfa_enrollment_required?: boolean;
  mfa_challenge_required?: boolean;
  aal?: "aal1" | "aal2";
};

export type MfaFactor = {
  id: string;
  friendly_name?: string;
  created_at?: string;
};

export type MfaStatus = {
  required: boolean;
  aal: "aal1" | "aal2";
  enrollment_required: boolean;
  challenge_required: boolean;
  factors: MfaFactor[];
};

export type ForgotPasswordResponse = {
  message: string;
  reset_url?: string;
  reset_token?: string;
};
