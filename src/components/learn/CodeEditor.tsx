'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  Moon,
  RotateCcw,
  Sun,
  XCircle,
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { githubDark, githubLight } from '@uiw/codemirror-theme-github'
import { cpp } from '@codemirror/lang-cpp'
import { javascript } from '@codemirror/lang-javascript'
import { ensureSyntaxTree, syntaxTree } from '@codemirror/language'
import {
  autocompletion,
  completeAnyWord,
  type Completion,
  type CompletionContext,
} from '@codemirror/autocomplete'
import type { Extension } from '@codemirror/state'
import { EditorView, type ViewUpdate } from '@codemirror/view'
import { cn } from '@/lib/utils'

type CodeEditorTheme = 'light' | 'dark'

interface CodeEditorProps {
  initialCode: string
  value?: string
  language?: string
  filename?: string
  storageKey?: string
  readOnly?: boolean
  hideReset?: boolean
  diffAgainst?: string | null
  diffTitle?: string
  className?: string
  onChange?: (code: string) => void
  onReset?: () => void
}

function safeGetLocalStorage(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSetLocalStorage(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    // Ignore (private mode, quota, etc.).
  }
}

function readPageCspNonce(): string | null {
  if (typeof document === 'undefined') return null
  const fromDataAttr =
    document.querySelector<HTMLElement>('[data-csp-nonce]')?.dataset.cspNonce
  if (fromDataAttr && fromDataAttr.trim()) return fromDataAttr.trim()
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')
  const metaNonce = meta?.content?.trim()
  if (metaNonce) return metaNonce
  const script = document.querySelector<HTMLScriptElement>('script[nonce]')
  const nonce = script?.nonce || script?.getAttribute('nonce')
  if (!nonce) return null
  return nonce.trim() ? nonce : null
}

function downloadTextFile(filename: string, contents: string) {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function inferDownloadName(
  filename: string | undefined,
  language: string,
): string {
  if (filename?.trim()) return filename.trim()
  let ext: string
  switch (language) {
    case 'cpp':
    case 'c':
    case 'arduino':
    case 'ino':
      ext = 'ino'
      break
    case 'typescript':
    case 'ts':
      ext = 'ts'
      break
    case 'javascript':
    case 'js':
      ext = 'js'
      break
    default:
      ext = 'txt'
  }
  return `code.${ext}`
}

function normalizeLanguageTag(language: string): string {
  return language.trim().toLowerCase()
}

function themeStorageKey(storageKey?: string) {
  if (!storageKey) return 'learn:code-editor:theme'
  return `${storageKey}:theme`
}

function codeMirrorLanguageExtension(language: string): Extension | null {
  const lang = normalizeLanguageTag(language)
  if (
    lang === 'cpp' ||
    lang === 'c++' ||
    lang === 'c' ||
    lang === 'arduino' ||
    lang === 'ino'
  ) {
    return cpp()
  }
  if (lang === 'typescript' || lang === 'ts') {
    return javascript({ typescript: true })
  }
  if (lang === 'javascript' || lang === 'js') {
    return javascript({ typescript: false })
  }
  return null
}

function isArduinoLanguage(language: string): boolean {
  const lang = normalizeLanguageTag(language)
  return lang === 'arduino' || lang === 'ino'
}

const arduinoCompletions: Completion[] = [
  {
    label: 'setup',
    type: 'function',
    detail: 'void setup()',
    apply: 'void setup() {\n  \n}\n',
  },
  {
    label: 'loop',
    type: 'function',
    detail: 'void loop()',
    apply: 'void loop() {\n  \n}\n',
  },
  { label: 'pinMode', type: 'function', detail: 'pinMode(pin, mode)' },
  {
    label: 'digitalWrite',
    type: 'function',
    detail: 'digitalWrite(pin, value)',
  },
  { label: 'digitalRead', type: 'function', detail: 'digitalRead(pin)' },
  { label: 'analogWrite', type: 'function', detail: 'analogWrite(pin, value)' },
  { label: 'analogRead', type: 'function', detail: 'analogRead(pin)' },
  { label: 'delay', type: 'function', detail: 'delay(ms)' },
  { label: 'millis', type: 'function', detail: 'millis()' },
  { label: 'micros', type: 'function', detail: 'micros()' },
  { label: 'Serial.begin', type: 'function', detail: 'Serial.begin(baud)' },
  { label: 'Serial.print', type: 'function', detail: 'Serial.print(value)' },
  {
    label: 'Serial.println',
    type: 'function',
    detail: 'Serial.println(value)',
  },
  { label: 'HIGH', type: 'constant' },
  { label: 'LOW', type: 'constant' },
  { label: 'INPUT', type: 'constant' },
  { label: 'OUTPUT', type: 'constant' },
  { label: 'INPUT_PULLUP', type: 'constant' },
]

function arduinoCompletionSource(context: CompletionContext) {
  const word = context.matchBefore(/[A-Za-z_][A-Za-z0-9_.]*/)
  if (!word) return null
  if (word.from === word.to && !context.explicit) return null
  return {
    from: word.from,
    options: arduinoCompletions,
    validFor: /^[A-Za-z0-9_.]*$/,
  }
}

const codeEditorTheme = EditorView.theme({
  '.cm-scroller': {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  '.cm-content': {
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
    padding: '16px 0',
  },
  '.cm-line': {
    padding: '0 16px',
  },
})

const codeEditorChromeLight = EditorView.theme({
  '&': {
    backgroundColor: '#f8fafc',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid #e2e8f0',
    color: '#94a3b8',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(14, 116, 144, 0.06)',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(14, 116, 144, 0.04)',
  },
})

const codeEditorChromeDark = EditorView.theme(
  {
    '&': {
      backgroundColor: '#0b1220',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      borderRight: '1px solid rgba(148, 163, 184, 0.22)',
      color: 'rgba(148, 163, 184, 0.85)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgba(14, 116, 144, 0.18)',
    },
    '.cm-activeLine': {
      backgroundColor: 'rgba(14, 116, 144, 0.12)',
    },
  },
  { dark: true },
)

type DiffOp =
  | { type: 'equal'; line: string }
  | { type: 'insert'; line: string }
  | { type: 'delete'; line: string }

function diffByLines(a: string, b: string): DiffOp[] {
  const aLines = a.replaceAll('\r\n', '\n').split('\n')
  const bLines = b.replaceAll('\r\n', '\n').split('\n')

  const LOOKAHEAD = 40
  const findNext = (
    lines: string[],
    target: string,
    start: number,
  ): number | null => {
    if (start < 0) return null
    const idx = lines.slice(start, start + LOOKAHEAD).indexOf(target)
    return idx === -1 ? null : start + idx
  }

  const ops: DiffOp[] = []
  let i = 0
  let j = 0
  while (i < aLines.length && j < bLines.length) {
    const aLine = aLines.at(i)
    const bLine = bLines.at(j)
    if (aLine === undefined || bLine === undefined) break

    if (aLine === bLine) {
      ops.push({ type: 'equal', line: aLine })
      i += 1
      j += 1
      continue
    }

    const nextInB = findNext(bLines, aLine, j + 1)
    const nextInA = findNext(aLines, bLine, i + 1)

    if (nextInA === null && nextInB === null) {
      ops.push({ type: 'delete', line: aLine }, { type: 'insert', line: bLine })
      i += 1
      j += 1
      continue
    }

    const distToB = nextInB === null ? Number.POSITIVE_INFINITY : nextInB - j
    const distToA = nextInA === null ? Number.POSITIVE_INFINITY : nextInA - i

    if (distToB <= distToA) {
      ops.push({ type: 'insert', line: bLine })
      j += 1
      continue
    }

    ops.push({ type: 'delete', line: aLine })
    i += 1
  }

  while (i < aLines.length) {
    const line = aLines.at(i)
    if (line !== undefined) ops.push({ type: 'delete', line })
    i += 1
  }
  while (j < bLines.length) {
    const line = bLines.at(j)
    if (line !== undefined) ops.push({ type: 'insert', line })
    j += 1
  }
  return ops
}

export function CodeEditor({
  initialCode,
  value,
  language = 'cpp',
  filename,
  storageKey,
  readOnly,
  hideReset,
  diffAgainst,
  diffTitle = 'Diff vs Solution',
  className,
  onChange,
  onReset,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const [showDiff, setShowDiff] = useState(false)
  const [verifyStatus, setVerifyStatus] = useState<
    | { kind: 'idle' }
    | { kind: 'ok' }
    | { kind: 'error'; message: string }
    | { kind: 'unknown'; message: string }
  >({ kind: 'idle' })
  const viewRef = useRef<EditorView | null>(null)

  const isControlled = value !== undefined
  const [uncontrolledCode, setUncontrolledCode] = useState(() => {
    if (!storageKey) return initialCode
    const saved = safeGetLocalStorage(storageKey)
    return saved ?? initialCode
  })
  const code = isControlled ? value : uncontrolledCode

  const [theme, setTheme] = useState<CodeEditorTheme>(() => {
    const saved = safeGetLocalStorage(themeStorageKey(storageKey))
    return saved === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    safeSetLocalStorage(themeStorageKey(storageKey), theme)
  }, [storageKey, theme])

  useEffect(() => {
    if (!storageKey) return
    safeSetLocalStorage(storageKey, code)
  }, [code, storageKey])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      // Ignore.
    }
  }

  const handleDownload = () => {
    const name = inferDownloadName(filename, language)
    downloadTextFile(name, code)
  }

  const handleReset = () => {
    if (isControlled) {
      onChange?.(initialCode)
    } else {
      setUncontrolledCode(initialCode)
      onChange?.(initialCode)
    }
    onReset?.()
  }

  const handleVerify = () => {
    const view = viewRef.current
    if (!view) {
      setVerifyStatus({
        kind: 'unknown',
        message: 'Editor not ready yet. Try again in a moment.',
      })
      return
    }

    const state = view.state
    const tree =
      ensureSyntaxTree(state, state.doc.length, 200) ?? syntaxTree(state)

    let firstError: { from: number; to: number } | null = null
    const cursor = tree.cursor()
    do {
      if (cursor.type.isError) {
        firstError = { from: cursor.from, to: cursor.to }
        break
      }
    } while (cursor.next())

    if (!firstError) {
      setVerifyStatus({ kind: 'ok' })
      return
    }

    const line = state.doc.lineAt(firstError.from)
    const col = firstError.from - line.from + 1
    const message = `Syntax issue near line ${line.number}, column ${col}.`
    setVerifyStatus({ kind: 'error', message })
    view.dispatch({
      selection: { anchor: firstError.from, head: firstError.to },
      scrollIntoView: true,
    })
    view.focus()
  }

  const extensions = useMemo(() => {
    const nonce = readPageCspNonce()
    const langExt = codeMirrorLanguageExtension(language)
    const completionExt = autocompletion({
      override: isArduinoLanguage(language)
        ? [arduinoCompletionSource, completeAnyWord]
        : [completeAnyWord],
    })

    const ext: Extension[] = [
      ...(nonce ? [EditorView.cspNonce.of(nonce)] : []),
      codeEditorTheme,
      theme === 'dark' ? codeEditorChromeDark : codeEditorChromeLight,
      completionExt,
    ]
    if (langExt) ext.push(langExt)
    return ext
  }, [language, theme])

  const hasDiff = Boolean(diffAgainst?.trim())
  const diffOps = useMemo(() => {
    if (!showDiff || !hasDiff || !diffAgainst) return null
    return diffByLines(code, diffAgainst)
  }, [code, diffAgainst, hasDiff, showDiff])

  const onCreateEditor = (view: EditorView) => {
    viewRef.current = view
  }

  const onUpdate = (update: ViewUpdate) => {
    if (!update.docChanged) return
    if (verifyStatus.kind !== 'idle') setVerifyStatus({ kind: 'idle' })
  }

  const basicSetup = useMemo(
    () => ({
      lineNumbers: true,
      foldGutter: true,
      highlightActiveLine: true,
      highlightActiveLineGutter: true,
      // Use our own configured completion extension.
      autocompletion: false,
    }),
    [],
  )

  return (
    <div
      className={cn(
        'rounded border border-slate-200 overflow-hidden',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-slate-100 border-b border-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          {filename && (
            <span className="text-sm font-mono text-slate-600 truncate">
              {filename}
            </span>
          )}
          <span className="text-xs font-mono text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">
            {language}
          </span>
          {storageKey && (
            <span className="text-[10px] font-mono text-slate-400">
              Autosaved
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
            }}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            aria-label={
              theme === 'light'
                ? 'Switch to dark theme'
                : 'Switch to light theme'
            }
            title={theme === 'light' ? 'Dark theme' : 'Light theme'}
          >
            {theme === 'light' ? (
              <Moon className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
            Theme
          </button>
          {!readOnly && (
            <button
              type="button"
              onClick={handleVerify}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              aria-label="Verify syntax"
              title="Verify syntax"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verify
            </button>
          )}
          {hasDiff && !readOnly && (
            <button
              type="button"
              onClick={() => {
                setShowDiff((prev) => !prev)
              }}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              aria-expanded={showDiff}
              aria-label={showDiff ? 'Hide diff' : 'Show diff'}
              title={showDiff ? 'Hide diff' : 'Show diff'}
            >
              <span className="font-mono">Diff</span>
            </button>
          )}
          {!readOnly && !hideReset && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
              aria-label="Reset to starter code"
              title="Reset to starter"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            aria-label="Download code"
            title="Download"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200"
            aria-label={copied ? 'Copied' : 'Copy code'}
            title={copied ? 'Copied' : 'Copy'}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className={theme === 'dark' ? 'bg-[#0b1220]' : 'bg-slate-50'}>
        <CodeMirror
          value={code}
          theme={theme === 'dark' ? githubDark : githubLight}
          basicSetup={basicSetup}
          indentWithTab
          editable={!readOnly}
          readOnly={Boolean(readOnly)}
          extensions={extensions}
          onCreateEditor={onCreateEditor}
          onUpdate={onUpdate}
          onChange={(next) => {
            if (!isControlled) setUncontrolledCode(next)
            onChange?.(next)
          }}
        />
      </div>

      {verifyStatus.kind !== 'idle' && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          {verifyStatus.kind === 'ok' ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>No syntax issues found.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <XCircle className="h-4 w-4" />
              <span>{verifyStatus.message}</span>
            </div>
          )}
        </div>
      )}

      {showDiff && diffOps && (
        <div className="border-t border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="text-xs font-mono text-slate-500">{diffTitle}</p>
            <button
              type="button"
              onClick={() => {
                setShowDiff(false)
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Close
            </button>
          </div>
          <div className="max-h-80 overflow-auto rounded border border-slate-200 bg-slate-50">
            <pre className="text-xs leading-5 font-mono p-3">
              <span className="block text-slate-400">{`--- Your Code`}</span>
              <span className="block text-slate-400">{`+++ Solution`}</span>
              {diffOps.map((op, idx) => {
                const prefix =
                  op.type === 'insert' ? '+' : op.type === 'delete' ? '-' : ' '
                const className =
                  op.type === 'insert'
                    ? 'bg-green-50 text-green-800'
                    : op.type === 'delete'
                      ? 'bg-red-50 text-red-800'
                      : 'text-slate-700'
                return (
                  <span
                    key={idx}
                    className={cn('block whitespace-pre', className)}
                  >
                    {prefix}
                    {op.line}
                  </span>
                )
              })}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
