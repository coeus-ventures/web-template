import { config } from "dotenv";
import { TokenService } from "../services/token/token.service";

// Ensure .env is loaded when executed via SSH or direct Bun
config({ path: ".env", override: false });

async function generateToken() {
  const email =
    process.argv[2] || process.env.ADMIN_EMAIL || "test@example.com";
  const callbackUrl = process.argv[3] || "/home";

  console.debug("[scripts/generate-token] start", { email, callbackUrl });
  try {
    const tokenUrl = await TokenService.issueOneTimeLoginToken(
      email,
      callbackUrl
    );
    const token = tokenUrl.split("token=")[1];

    // After issuing the new token, invalidate previous tokens while keeping the new one active
    try {
      console.debug(
        "[scripts/generate-token] invalidating previous tokens after issue",
        { email, token }
      );
      await TokenService.invalidateTokensForEmail(email, {
        excludeToken: token,
      });
    } catch (invalidateError) {
      console.error(
        "Warning: Failed to invalidate previous tokens after issue:",
        invalidateError
      );
    }

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
    console.debug("[scripts/generate-token] done", { email });
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
    console.debug("[scripts/generate-token] failed", {
      email,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

generateToken();
