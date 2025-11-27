import { TokenService } from "@/shared/services/token/token.service";
// Removed model dependency

async function testTokenValidation() {
  const email = "validation-test@example.com";

  console.log("Testing token validation...\n");

  try {
    // Clean up first
    await TokenService.invalidateTokensForEmail(email);
    console.log("1. Cleaned up existing tokens");

    // Create a token
    const tokenUrl = await TokenService.issueOneTimeLoginToken(email, "/home");
    const token = tokenUrl.split("token=")[1];
    console.log(`2. Created token: ${token}`);

    // Check if there's any valid token for the email (no models)
    const hasValid = await TokenService.hasValidToken(email);
    console.log(`3. hasValidToken(email): ${hasValid ? "YES" : "NO"}`);

    // Try to validate and consume
    const tokenData = await TokenService.validateAndConsume(token);
    console.log(
      `4. validateAndConsume result: ${tokenData ? "SUCCESS" : "FAILED"}`
    );
    if (tokenData) {
      console.log(`   - Email: ${tokenData.email}`);
      console.log(`   - Callback: ${tokenData.callbackUrl}`);
    }

    // Try again (reusable tokens)
    const secondAttempt = await TokenService.validateAndConsume(token);
    console.log(
      `5. Second attempt (reusable): ${secondAttempt ? "SUCCESS" : "FAILED"}`
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

testTokenValidation();
