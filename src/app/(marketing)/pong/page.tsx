import type { Metadata } from 'next'
import Link from 'next/link'
import {
  roomyPrimaryLink,
  roomySecondaryLink,
} from '@/components/marketing/link-classes'

export const metadata: Metadata = {
  title: 'Pong Ping',
  description: 'NEW and IMPROVED (and low-effort) Pong Ping!',
  robots: 'noindex, nofollow',
}

export default function PongPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-slate-50">
      <div className="text-center max-w-2xl w-full">
        <h1 className="font-mono text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
          Pong Ping
        </h1>

        <p className="text-slate-600 mb-8">
          NEW and IMPROVED (and low-effort) Pong Ping!<br></br>
        </p>

        <div className="w-full max-w-[1300px] mx-auto mb-8">
          <iframe
            style={{
              display: 'block',
              margin: '0 auto',
              borderRadius: '12px',
              width: '100%',
              height: 'auto',
              aspectRatio: '485/402',
            }}
            src="https://scratch.mit.edu/projects/958723642/embed"
            title="Pong Game"
          />
        </div>

        <p className="text-slate-600 mb-8">
          <b>Controls</b>
          <br></br>
          left/right arrow — move paddle<br></br>
          space — flick paddle<br></br>S — use time slower (orange powerup)
          <br></br>R — use score restore (pink powerup)<br></br>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className={roomyPrimaryLink}
          >
            Back to home
          </Link>
          <Link
            href="https://scratch.mit.edu/projects/958723642"
            target="_blank"
            rel="noopener noreferrer"
            className={roomySecondaryLink}
          >
            View on Scratch
          </Link>
        </div>
      </div>
    </div>
  )
}
