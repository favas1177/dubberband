import { ReactNode } from "react";
import { Film, CheckCircle2, Star } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Left side - Visual Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-950 to-teal-900">
        {/* Background glow effects */}
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-teal-500/20 blur-[120px] rounded-full mix-blend-screen" />
        
        <div className="relative z-10 w-full flex flex-col justify-between p-12 lg:p-20 text-white h-full">
          {/* Logo area */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Film className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Dubberband</span>
          </div>

          {/* Feature Showcase */}
          <div className="space-y-6 max-w-lg mt-8">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
              AI Lip-Sync <br/> Translation
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400"> for Creators</span>
            </h1>
            <p className="text-indigo-200 text-lg">
              Reach global audiences with perfectly synced audio in over 50 languages. Studio-quality dubbing in just a few clicks.
            </p>
            
            <div className="space-y-3 pt-4">
              {["Voice Cloning", "Visual Lip Sync", "50+ Languages"].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-teal-400" />
                  <span className="font-medium text-slate-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm max-w-lg">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-teal-400 text-teal-400" />
              ))}
            </div>
            <p className="italic text-indigo-100 text-sm leading-relaxed mb-4">
              "Dubberband completely changed how we localize our content. The lip-sync looks so natural that our international viewers thought we refilmed everything."
            </p>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">
                SJ
              </div>
              <div>
                <p className="font-semibold text-sm">Sarah Jenkins</p>
                <p className="text-indigo-300 text-xs">Content Director</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
