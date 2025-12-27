import Link from 'next/link'
import {
  roomyPrimaryLink,
  roomySecondaryLink,
} from '@/components/marketing/link-classes'

interface TeapotContentProps {
  viewCount: number
}

export function TeapotContent({ viewCount }: TeapotContentProps) {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-24 bg-slate-50">
      <div className="text-center max-w-lg">
        {/* ASCII Teapot */}
        <pre className="font-mono text-cyan-700 text-xs sm:text-sm mb-8 inline-block text-left">
          {`
            ;,'
     _o_    ;:;'
 ,-.'---\`.__ ;
((j\`=====',-'
 \`-\\     /
    \`-=-'     hjw
`}
        </pre>

        <h1 className="font-mono text-6xl sm:text-8xl font-bold text-slate-900 mb-4">
          418
        </h1>

        <h2 className="font-mono text-xl sm:text-2xl text-cyan-700 mb-6">
          I&apos;m a teapot
        </h2>

        <p className="text-slate-600 mb-8 leading-relaxed">
          The requested entity body is short and stout.
          <br />
          This server is a teapot, not a coffee machine.
          <br />
          <span className="text-sm text-slate-500 mt-2 block">
            RFC 2324 &bull; Hyper Text Coffee Pot Control Protocol
          </span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className={roomyPrimaryLink}
          >
            Tip me over
          </Link>
          <Link
            href="/shop"
            className={roomySecondaryLink}
          >
            Pour me out
          </Link>
        </div>

        <p className="mt-12 text-xs text-slate-400 font-mono">
          Error 418: The server refuses to brew coffee because it is,
          permanently, a teapot.
        </p>

        <p className="mt-4 text-xs text-slate-400 font-mono">
          {viewCount} {viewCount === 1 ? 'person has' : 'people have'}{' '}
          discovered this teapot
        </p>
      </div>
    </div>
  )
}
