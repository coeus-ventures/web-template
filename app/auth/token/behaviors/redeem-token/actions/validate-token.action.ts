"use server";

import "server-only";
import { TokenService } from "@/services/token/token.service";

interface ValidateTokenResult {
  success: boolean;
  data?: {
    email: string;
    callbackUrl: string;
  };
  error?: string;
}

export async function validateToken(
  token: string
): Promise<ValidateTokenResult> {
  try {
    // Validate token parameter
    if (!token || typeof token !== "string") {
      return {
        success: false,
        error: "Invalid token format",
      };
    }

    // Validate and consume the token
    const result = await TokenService.validateAndConsume(token);

    if (!result) {
      return {
        success: false,
        error: "Invalid or expired token",
      };
    }

    return {
      success: true,
      data: {
        email: result.email,
        callbackUrl: result.callbackUrl,
      },
    };
  } catch (error) {
    console.error("Error validating token:", error);
    return {
      success: false,
      error: "Token validation failed",
    };
  }
}
