// PostHog analytics event tracking utilities
// https://posthog.com/docs/libraries/next-js

import posthog from "posthog-js"

// Event names for type safety
export const AnalyticsEvents = {
  // Page views (auto-captured by PostHog)
  PAGE_VIEW: "$pageview",

  // Product events
  PRODUCT_VIEWED: "product_viewed",
  ADD_TO_CART: "add_to_cart",
  REMOVE_FROM_CART: "remove_from_cart",
  UPDATE_CART_QUANTITY: "update_cart_quantity",

  // Checkout events
  CHECKOUT_STARTED: "checkout_started",
  PURCHASE_COMPLETED: "purchase_completed",

  // License events
  LICENSE_CLAIMED: "license_claimed",
  LICENSE_CLAIM_FAILED: "license_claim_failed",

  // Learning events
  LESSON_STARTED: "lesson_started",
  LESSON_COMPLETED: "lesson_completed",
  COURSE_STARTED: "course_started",
  COURSE_COMPLETED: "course_completed",

  // Community events
  QUESTION_POSTED: "question_posted",
  ANSWER_POSTED: "answer_posted",
  VOTE_CAST: "vote_cast",

  // Auth events
  SIGN_UP_STARTED: "sign_up_started",
  SIGN_UP_COMPLETED: "sign_up_completed",
  LOGIN_STARTED: "login_started",
  LOGIN_COMPLETED: "login_completed",

  // Newsletter
  NEWSLETTER_SUBSCRIBED: "newsletter_subscribed",
} as const

// Type for event names
export type AnalyticsEvent = (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]

const isBrowser = typeof window !== "undefined"

// Track a custom event
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>) {
  if (isBrowser) {
    posthog.capture(event, properties)
  }
}

// Product tracking
export function trackProductViewed(product: {
  id: string
  name: string
  slug: string
  price: number
}) {
  trackEvent(AnalyticsEvents.PRODUCT_VIEWED, {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    price: product.price,
  })
}

export function trackAddToCart(product: {
  id: string
  name: string
  slug: string
  price: number
  quantity: number
}) {
  trackEvent(AnalyticsEvents.ADD_TO_CART, {
    product_id: product.id,
    product_name: product.name,
    product_slug: product.slug,
    price: product.price,
    quantity: product.quantity,
  })
}

export function trackRemoveFromCart(product: { id: string; name: string }) {
  trackEvent(AnalyticsEvents.REMOVE_FROM_CART, {
    product_id: product.id,
    product_name: product.name,
  })
}

// Checkout tracking
export function trackCheckoutStarted(cart: {
  items: { id: string; name: string; quantity: number; price: number }[]
  total: number
}) {
  trackEvent(AnalyticsEvents.CHECKOUT_STARTED, {
    cart_value: cart.total,
    item_count: cart.items.length,
    items: cart.items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  })
}

export function trackPurchaseCompleted(order: {
  orderId: string
  total: number
  items: { id: string; name: string; quantity: number; price: number }[]
}) {
  trackEvent(AnalyticsEvents.PURCHASE_COMPLETED, {
    order_id: order.orderId,
    value: order.total,
    item_count: order.items.length,
    items: order.items.map((item) => ({
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
    })),
  })
}

// License tracking
export function trackLicenseClaimed(license: {
  licenseId: string
  productName: string
  method: "code" | "token"
}) {
  trackEvent(AnalyticsEvents.LICENSE_CLAIMED, {
    license_id: license.licenseId,
    product_name: license.productName,
    claim_method: license.method,
  })
}

// Learning tracking
export function trackLessonStarted(lesson: {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseName: string
}) {
  trackEvent(AnalyticsEvents.LESSON_STARTED, {
    lesson_id: lesson.lessonId,
    lesson_title: lesson.lessonTitle,
    course_id: lesson.courseId,
    course_name: lesson.courseName,
  })
}

export function trackLessonCompleted(lesson: {
  lessonId: string
  lessonTitle: string
  courseId: string
  courseName: string
}) {
  trackEvent(AnalyticsEvents.LESSON_COMPLETED, {
    lesson_id: lesson.lessonId,
    lesson_title: lesson.lessonTitle,
    course_id: lesson.courseId,
    course_name: lesson.courseName,
  })
}

// Community tracking
export function trackQuestionPosted(question: {
  questionId: string
  title: string
  tags: string[]
}) {
  trackEvent(AnalyticsEvents.QUESTION_POSTED, {
    question_id: question.questionId,
    title: question.title,
    tags: question.tags,
  })
}

export function trackAnswerPosted(answer: { questionId: string; answerId: string }) {
  trackEvent(AnalyticsEvents.ANSWER_POSTED, {
    question_id: answer.questionId,
    answer_id: answer.answerId,
  })
}

export function trackVoteCast(vote: {
  targetType: "question" | "answer"
  targetId: string
  voteType: "up" | "down"
}) {
  trackEvent(AnalyticsEvents.VOTE_CAST, {
    target_type: vote.targetType,
    target_id: vote.targetId,
    vote_type: vote.voteType,
  })
}

// Identify user (call after login/signup)
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (isBrowser) {
    posthog.identify(userId, properties)
  }
}

// Reset user (call on logout)
export function resetUser() {
  if (isBrowser) {
    posthog.reset()
  }
}
