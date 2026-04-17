import { Component } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
          <div className="text-center max-w-md">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertOctagon size={28} className="text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight mb-2">
              Something went wrong
            </h2>
            <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-semibold rounded bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
