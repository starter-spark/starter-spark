import { checkBotId as checkBotIdRaw } from 'botid/server'
import { NextResponse } from 'next/server'

type BotIdResult = Awaited<ReturnType<typeof checkBotIdRaw>>

function shouldRunBotId(): boolean {
  if (process.env.VERCEL === '1') return true
  return process.env.BOTID_ALLOW_NON_VERCEL === '1'
}

function bypassResult(): BotIdResult {
  return { isBot: false, isVerifiedBot: false } as BotIdResult
}

export async function checkBotId(
  ...args: Parameters<typeof checkBotIdRaw>
): Promise<BotIdResult> {
  if (!shouldRunBotId()) return bypassResult()

  try {
    return await checkBotIdRaw(...args)
  } catch (err) {
    // Fail open so BotID outages/misconfig don't take down critical endpoints.
    console.error('BotID check failed:', err)
    return bypassResult()
  }
}

/**
 * Check if the request is from a bot.
 * Returns null if the request is legitimate, or a 403 response if it's a bot.
 *
 * Usage in API routes:
 * ```ts
 * const botResponse = await checkBotAndReject()
 * if (botResponse) return botResponse
 * ```
 */
export async function checkBotAndReject(): Promise<NextResponse | null> {
  const result = await checkBotId()

  if (result.isBot) {
    // Allow verified bots like search engines, AI assistants, etc.
    if (result.isVerifiedBot) {
      return null
    }

    return NextResponse.json(
      { error: 'Access denied. Automated requests are not allowed.' },
      { status: 403 },
    )
  }

  return null
}

/**
 * Check if the request is from a bot, with custom handling for verified bots.
 * Returns the full BotID result for custom logic.
 */
export async function getBotIdResult() {
  return checkBotId()
}
