"use client"

import * as React from "react"

interface ClientErrorBoundaryProps {
  children: React.ReactNode
  fallback: React.ReactNode
  onError?: (error: Error) => void
}

interface ClientErrorBoundaryState {
  hasError: boolean
}

export class ClientErrorBoundary extends React.Component<
  ClientErrorBoundaryProps,
  ClientErrorBoundaryState
> {
  state: ClientErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

