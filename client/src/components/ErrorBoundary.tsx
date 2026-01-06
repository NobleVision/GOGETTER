import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home, LogIn } from "lucide-react";
import { Component, ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error for monitoring
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  private isAuthError(): boolean {
    const error = this.state.error;
    if (!error) return false;
    
    const message = error.message.toLowerCase();
    return (
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('auth') ||
      message.includes('token') ||
      message.includes('session')
    );
  }

  private getErrorMessage(): string {
    const error = this.state.error;
    if (!error) return "An unexpected error occurred";

    if (this.isAuthError()) {
      return "Authentication failed. Please sign in again.";
    }

    // Check for network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return "Network connection error. Please check your internet connection.";
    }

    // Check for API errors
    if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
      return "Server error. Please try again in a moment.";
    }

    if (error.message.includes('404') || error.message.includes('Not Found')) {
      return "The requested resource was not found.";
    }

    return error.message || "An unexpected error occurred";
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleSignIn = () => {
    window.location.href = '/api/oauth/google/init';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isAuth = this.isAuthError();
      const errorMessage = this.getErrorMessage();

      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className={cn(
                "mb-6 flex-shrink-0",
                isAuth ? "text-amber-400" : "text-destructive"
              )}
            />

            <h2 className="text-xl mb-4 text-white text-center">
              {isAuth ? "Authentication Required" : "Something went wrong"}
            </h2>

            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {errorMessage}
            </p>

            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-6">
                <summary className="cursor-pointer text-sm text-muted-foreground mb-2">
                  Show error details
                </summary>
                <div className="p-4 w-full rounded bg-muted overflow-auto">
                  <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {isAuth ? (
                <>
                  <Button
                    onClick={this.handleSignIn}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="border-border"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={this.handleRetry}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="border-border"
                  >
                    Reload Page
                  </Button>
                  <Button
                    variant="outline"
                    onClick={this.handleGoHome}
                    className="border-border"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Go Home
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
