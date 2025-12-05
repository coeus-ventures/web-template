import { TokenService } from "@/shared/integrations/token/token.service";

async function testReusableToken() {
  const email = "reuse-test@example.com";
  const callbackUrl = "/test";

  console.log("Testing reusable token behavior...\n");

  try {
    // Clean up first
    await TokenService.invalidateTokensForEmail(email);
    console.log("1. Cleaned up existing tokens");

    // Create a token
    const tokenUrl = await TokenService.issueOneTimeLoginToken(
      email,
      callbackUrl
    );
    const token = tokenUrl.split("token=")[1];
    console.log(`2. Created token: ${token}`);

    // Use the token first time
    const firstUse = await TokenService.validateAndConsume(token);
    console.log(`3. First use result: ${firstUse ? "SUCCESS" : "FAILED"}`);
    if (firstUse) {
      console.log(
        `   - Email: ${firstUse.email}, Callback: ${firstUse.callbackUrl}`
      );
    }

    // Use the same token second time (should still work)
    const secondUse = await TokenService.validateAndConsume(token);
    console.log(`4. Second use result: ${secondUse ? "SUCCESS" : "FAILED"}`);
    if (secondUse) {
      console.log(
        `   - Email: ${secondUse.email}, Callback: ${secondUse.callbackUrl}`
      );
    }

    // Use the same token third time (should still work)
    const thirdUse = await TokenService.validateAndConsume(token);
    console.log(`5. Third use result: ${thirdUse ? "SUCCESS" : "FAILED"}`);

    // Now generate a new token (should invalidate the first)
    console.log("6. Generating new token (should invalidate first)...");
    await TokenService.invalidateTokensForEmail(email);
    const newTokenUrl = await TokenService.issueOneTimeLoginToken(
      email,
      callbackUrl
    );
    const newToken = newTokenUrl.split("token=")[1];
    console.log(`   New token: ${newToken}`);

    // Try to use the old token (should fail now)
    const oldTokenAfterNew = await TokenService.validateAndConsume(token);
    console.log(
      `7. Old token after new generation: ${
        oldTokenAfterNew ? "SUCCESS (unexpected!)" : "FAILED (expected)"
      }`
    );

    // Try the new token (should work)
    const newTokenTest = await TokenService.validateAndConsume(newToken);
    console.log(
      `8. New token validation: ${newTokenTest ? "SUCCESS" : "FAILED"}`
    );

    console.log("\n✅ Reusable token test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testReusableToken();
