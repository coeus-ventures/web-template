import { TokenService } from "../services/token/token.service";

async function generateToken() {
  const email = "test@example.com";
  const callbackUrl = "/home";

  try {
    // Invalidate any existing tokens for this email before creating a new one
    // Ignore errors if table doesn't exist or if there are no tokens to invalidate
    try {
      await TokenService.invalidateTokensForEmail(email);
    } catch (invalidateError) {
      // Log but don't fail - token generation can proceed
      console.error(
        "Warning: Failed to invalidate existing tokens:",
        invalidateError
      );
    }

    const tokenUrl = await TokenService.issueOneTimeLoginToken(
      email,
      callbackUrl
    );
    const token = tokenUrl.split("token=")[1];

    const result = {
      success: true,
      email,
      token,
      tokenUrl,
      examples: {
        default: tokenUrl,
        withRedirect: {
          settings: `${tokenUrl}&redirectTo=/settings`,
          profile: `${tokenUrl}&redirectTo=/profile`,
          admin: `${tokenUrl}&redirectTo=/admin`,
        },
      },
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.log(
      JSON.stringify(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        null,
        2
      )
    );
  }
}

generateToken();
