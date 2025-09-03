import { requestPasswordReset } from "./passwordReset/requestPasswordReset.js";
import { verifyResetToken } from "./passwordReset/verifyResetToken.js";
import { resetPassword } from "./passwordReset/resetPassword.js";

export { requestPasswordReset, verifyResetToken, resetPassword };

export default {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
};
