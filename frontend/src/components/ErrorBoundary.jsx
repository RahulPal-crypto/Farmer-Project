import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("KrishiSetu ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-3xl shadow-inner">
              🌱
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">
              कृषिसेतु (KrishiSetu)
            </h1>
            <p className="text-sm text-slate-600 mb-6 font-medium leading-relaxed">
              पृष्ठ लोड करने में कोई अस्थायी समस्या आई। कृपया पृष्ठ को पुनः लोड करें।
              <br />
              <span className="text-xs text-slate-500">
                (A temporary rendering issue occurred. Please click below to reload.)
              </span>
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-xl shadow-md transition"
              >
                🔄 पृष्ठ को पुनः लोड करें (Reload Page)
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                  } catch (e) {}
                  window.location.href = "/";
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                होम पेज पर जाएं (Return to Home)
              </button>
            </div>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-[11px] text-slate-400 cursor-pointer hover:underline">
                  तकनीकी विवरण (Technical Details)
                </summary>
                <pre className="mt-2 p-3 bg-rose-50 text-rose-800 text-[10px] rounded-lg overflow-auto max-h-32 border border-rose-100">
                  {String(this.state.error?.stack || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
