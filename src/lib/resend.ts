import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

export const resend = new Resend(apiKey)
export const NEWSLETTER_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || ''
