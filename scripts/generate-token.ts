import { TokenService } from "@/services/token/token.service";

async function generateToken() {
  const email = "test@example.com";
  const callbackUrl = "/home";

  try {
    // Invalidate any existing tokens for this email before creating a new one
    await TokenService.invalidateTokensForEmail(email);

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
