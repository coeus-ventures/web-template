import { describe, it, expect, beforeEach, vi } from "vitest";
import { validateToken } from "../actions/validate-token.action";
import { TokenService } from "@/services/token.service";

vi.mock("@/services/token.service");

describe("validateToken action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return success with data for valid token", async () => {
    // Mock successful token validation
    vi.mocked(TokenService.validateAndConsume).mockResolvedValue({
      email: "test@example.com",
      callbackUrl: "/dashboard",
    });

    const result = await validateToken("valid-token-123");

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      email: "test@example.com",
      callbackUrl: "/dashboard",
    });
    expect(result.error).toBeUndefined();
    expect(TokenService.validateAndConsume).toHaveBeenCalledWith("valid-token-123");
  });

  it("should return error for expired token", async () => {
    // Mock expired token
    vi.mocked(TokenService.validateAndConsume).mockResolvedValue(null);

    const result = await validateToken("expired-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
    expect(result.data).toBeUndefined();
  });

  it("should return error for already consumed token", async () => {
    // Mock consumed token (returns null)
    vi.mocked(TokenService.validateAndConsume).mockResolvedValue(null);

    const result = await validateToken("consumed-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid or expired token");
    expect(result.data).toBeUndefined();
  });

  it("should return error for missing token", async () => {
    const result = await validateToken("");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid token format");
    expect(result.data).toBeUndefined();
    expect(TokenService.validateAndConsume).not.toHaveBeenCalled();
  });

  it("should handle service errors gracefully", async () => {
    // Mock service throwing an error
    vi.mocked(TokenService.validateAndConsume).mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await validateToken("valid-token");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Token validation failed");
    expect(result.data).toBeUndefined();
  });
});