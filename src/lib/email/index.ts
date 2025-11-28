// Email sending utilities
export {
  sendPurchaseConfirmation,
  sendClaimLink,
  sendWelcomeEmail,
} from "./send"

// Email templates (for preview/testing)
export { PurchaseConfirmationEmail } from "./templates/purchase-confirmation"
export { ClaimLinkEmail } from "./templates/claim-link"
export { WelcomeEmail } from "./templates/welcome"
