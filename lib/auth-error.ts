/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
// Type definition for APIError to avoid direct import in client-side code
//eslin
type APIErrorType = {
  statusCode: number;
  body?: {
    message?: string;
    code?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

// Check if we're running in a browser environment
const isServer = typeof window === "undefined";

// This will hold the actual APIError class if available
let BetterAuthAPIError: any;

if (isServer) {
  // Only import in server-side code
  try {
    BetterAuthAPIError = require("better-auth").APIError;
  } catch (e) {
    console.warn("Failed to load Better Auth APIError:", e);
  }
}

export class AuthError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    options: {
      statusCode?: number;
      code: string;
      details?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = "AuthError";
    this.statusCode = options.statusCode || 400;
    this.code = options.code;
    this.details = options.details;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

export const authErrors = {
  // Authentication errors (4xx)
  invalidCredentials: new AuthError("Invalid email or password", {
    statusCode: 401,
    code: "INVALID_CREDENTIALS",
  }),

  unauthorized: new AuthError("Authentication required", {
    statusCode: 401,
    code: "UNAUTHORIZED",
  }),

  forbidden: new AuthError("Insufficient permissions", {
    statusCode: 403,
    code: "FORBIDDEN",
  }),

  emailAlreadyInUse: new AuthError("Email already in use", {
    statusCode: 400,
    code: "EMAIL_ALREADY_IN_USE",
  }),

  invalidEmail: new AuthError("Invalid email format", {
    statusCode: 400,
    code: "INVALID_EMAIL",
  }),

  weakPassword: new AuthError("Password is too weak", {
    statusCode: 400,
    code: "WEAK_PASSWORD",
  }),

  invalidToken: new AuthError("Invalid or expired token", {
    statusCode: 400,
    code: "INVALID_TOKEN",
  }),

  tokenExpired: new AuthError("Token has expired", {
    statusCode: 401,
    code: "TOKEN_EXPIRED",
  }),

  // Rate limiting
  tooManyRequests: new AuthError("Too many requests, please try again later", {
    statusCode: 429,
    code: "TOO_MANY_REQUESTS",
  }),

  // Server errors (5xx)
  internalServerError: new AuthError("Internal server error", {
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
  }),

  serviceUnavailable: new AuthError("Service temporarily unavailable", {
    statusCode: 503,
    code: "SERVICE_UNAVAILABLE",
  }),

  // Gateway proxy errors
  gatewayUnauthorized: new AuthError("Unauthorized - Please login first", {
    statusCode: 401,
    code: "GATEWAY_UNAUTHORIZED",
  }),

  gatewayForbidden: new AuthError("Admin access required", {
    statusCode: 403,
    code: "GATEWAY_FORBIDDEN",
  }),

  gatewayUnavailable: new AuthError(
    "Database administration service is not running",
    {
      statusCode: 503,
      code: "GATEWAY_UNAVAILABLE",
    }
  ),

  gatewayTimeout: new AuthError("Gateway request timeout", {
    statusCode: 504,
    code: "GATEWAY_TIMEOUT",
  }),

  // Custom error creator
  create: (
    message: string,
    code: string,
    statusCode = 400,
    details?: Record<string, any>
  ) => {
    return new AuthError(message, { statusCode, code, details });
  },
};

// Type for the auth errors
type AuthErrorType = Exclude<keyof typeof authErrors, "create">;

// Error handler middleware
export const authErrorHandler = (error: unknown) => {
  // If it's already an AuthError, return it
  if (error instanceof AuthError) {
    return error;
  }

  // Handle APIError from Better Auth on the server
  if (isServer && BetterAuthAPIError && error instanceof BetterAuthAPIError) {
    const apiError = error as APIErrorType;
    return new AuthError(apiError.body?.message || "Authentication error", {
      statusCode: apiError.statusCode,
      code: apiError.body?.code || "AUTH_ERROR",
      details: apiError.body,
    });
  }

  // Handle error objects that match the APIError structure but might not be instances of APIError
  if (error && typeof error === "object" && "statusCode" in error) {
    const apiError = error as any;
    return new AuthError(
      apiError.body?.message || apiError.message || "Authentication error",
      {
        statusCode: apiError.statusCode || 500,
        code: apiError.body?.code || "AUTH_ERROR",
        details: apiError.body || {},
      }
    );
  }

  // Handle other error types
  if (error instanceof Error) {
    return new AuthError(error.message, {
      statusCode: 500,
      code: "UNKNOWN_ERROR",
    });
  }

  // Fallback for unknown error types
  return new AuthError("An unknown authentication error occurred", {
    statusCode: 500,
    code: "UNKNOWN_ERROR",
  });
};

// Helper function to throw standardized auth errors
export const throwAuthError = (
  errorKey: AuthErrorType,
  details?: Record<string, any>
) => {
  const error = authErrors[errorKey];
  if (details) {
    return new AuthError(error.message, {
      statusCode: error.statusCode,
      code: error.code,
      details,
    });
  }
  return error;
};

// Type guard to check if error is AuthError
export const isAuthError = (error: unknown): error is AuthError => {
  return error instanceof AuthError;
};
