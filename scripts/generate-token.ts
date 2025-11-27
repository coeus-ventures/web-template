import { TokenService } from "@/shared/services/token/token.service";

async function generateToken() {
  // Read arguments from command line
  // argv[0] = node/bun, argv[1] = script path, argv[2] = email, argv[3] = callbackUrl
  const email = process.argv[2] || "test@example.com";
  const callbackUrl = process.argv[3] || "/home";

  if (!email || email === "") {
    console.log(
      JSON.stringify(
        {
          success: false,
          error: "Email is required",
        },
        null,
        2
      )
    );
    process.exit(1);
  }

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
    process.exit(1);
  }
}

generateToken();
