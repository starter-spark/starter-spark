import { NextResponse } from "next/server"
import { resend, NEWSLETTER_AUDIENCE_ID } from "@/lib/resend"
import { z } from "zod"

const subscribeSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = subscribeSchema.parse(body)

    // Check if audience ID is configured
    if (!NEWSLETTER_AUDIENCE_ID) {
      console.error("RESEND_AUDIENCE_ID not configured")
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      )
    }

    // Check if contact already exists
    const { data: existingContact } = await resend.contacts.get({
      audienceId: NEWSLETTER_AUDIENCE_ID,
      email,
    })

    if (existingContact && !existingContact.unsubscribed) {
      return NextResponse.json(
        { message: "You're already subscribed!" },
        { status: 200 }
      )
    }

    // If contact exists but is unsubscribed, update them
    if (existingContact && existingContact.unsubscribed) {
      await resend.contacts.update({
        audienceId: NEWSLETTER_AUDIENCE_ID,
        id: existingContact.id,
        unsubscribed: false,
      })

      return NextResponse.json(
        { message: "Welcome back! You've been resubscribed." },
        { status: 200 }
      )
    }

    // Create new contact
    const { data, error } = await resend.contacts.create({
      audienceId: NEWSLETTER_AUDIENCE_ID,
      email,
      unsubscribed: false,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Thanks for subscribing!", data },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      )
    }

    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
