import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const articleId = isRecord(body) && typeof body.articleId === "string" ? body.articleId : null
    const isHelpful = isRecord(body) && typeof body.isHelpful === "boolean" ? body.isHelpful : null

    if (!articleId || typeof isHelpful !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 }
      )
    }

    // Call the RPC function to record feedback
    const { error } = await supabaseAdmin.rpc("record_article_feedback", {
      article_id: articleId,
      is_helpful: isHelpful,
    })

    if (error) {
      console.error("Error recording feedback:", error)
      return NextResponse.json(
        { error: "Failed to record feedback" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in feedback endpoint:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
