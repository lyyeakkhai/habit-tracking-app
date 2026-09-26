import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export interface ErrorBoundaryProps {
  children: ReactNode
  sectionName?: string
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Hand-written ErrorBoundary class component to isolate component crashes
 * and ensure one broken section never whites out the entire application.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI.
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for diagnostics
    console.error(`[ErrorBoundary - ${this.props.sectionName || 'AppSection'}]:`, error, errorInfo)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): ReactNode {
    const { hasError, error } = this.state
    const { children, sectionName, fallback } = this.props

    if (hasError && error) {
      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset)
      }
      if (fallback) {
        return fallback
      }

      return (
        <div
          className="glass-panel"
          style={{
            padding: '24px',
            margin: '16px 0',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            backgroundColor: 'rgba(254, 242, 242, 0.8)',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#991b1b' }}>
                {sectionName ? `${sectionName} Section Error` : 'Section Encountered an Error'}
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
                This section crashed, but the rest of your app remains active and secure.
              </p>
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontFamily: 'monospace',
              color: '#7f1d1d',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              wordBreak: 'break-word',
            }}
          >
            {error.message || 'Unknown runtime error'}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={this.handleReset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                padding: '6px 14px',
                color: '#991b1b',
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        </div>
      )
    }

    return children
  }
}

export default ErrorBoundary
