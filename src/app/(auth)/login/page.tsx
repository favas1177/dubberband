"use client";

import { createClient } from "@/lib/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useEffect, useState } from "react";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";

export default function LoginPage() {
  const supabase = createClient();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const checkAndRedirect = (session: Session | null) => {
      if (session) {
        setIsRedirecting(true);
        window.location.href = "/";
      }
    };

    // Check existing session on mount
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (data?.session) {
        checkAndRedirect(data.session);
      }
    });

    // Listen for sign-in / initial session events
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED")) {
        checkAndRedirect(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  if (isRedirecting) {
    return (
      <div className="w-full space-y-6 bg-slate-950 p-8 rounded-2xl border border-white/5 shadow-2xl text-center py-16">
        <div className="inline-block animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full mb-4" />
        <h3 className="text-xl font-bold text-white">Signing you in...</h3>
        <p className="text-slate-400 text-sm">Redirecting to your dashboard</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 bg-slate-950 p-8 rounded-2xl border border-white/5 shadow-2xl">
      <div className="space-y-2 mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-white">Welcome</h2>
        <p className="text-slate-400">Sign in or create an account</p>
      </div>

      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#4f46e5', // indigo-600
                brandAccent: '#4338ca', // indigo-700
                brandButtonText: 'white',
                defaultButtonBackground: '#0f172a', // slate-900
                defaultButtonBackgroundHover: '#1e293b', // slate-800
                defaultButtonBorder: '#1e293b',
                defaultButtonText: 'white',
                inputBackground: '#0f172a',
                inputBorder: '#1e293b',
                inputBorderHover: '#334155',
                inputBorderFocus: '#4f46e5',
                inputText: 'white',
                inputPlaceholder: '#64748b', // slate-500
              },
              space: {
                buttonPadding: '10px 15px',
                inputPadding: '10px 15px',
              },
              borderWidths: {
                buttonBorderWidth: '1px',
                inputBorderWidth: '1px',
              },
              radii: {
                borderRadiusButton: '8px',
                buttonBorderRadius: '8px',
                inputBorderRadius: '8px',
              },
            },
          },
          className: {
            container: 'w-full',
            button: 'w-full font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 transition-colors border-0 flex items-center justify-center gap-2',
            input: 'text-sm bg-slate-900 border border-slate-800 text-white placeholder-slate-500 rounded-lg w-full px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all',
            label: 'text-sm text-slate-300 font-medium mb-1.5 block',
            message: 'text-sm text-slate-400',
            anchor: 'text-sm text-indigo-400 hover:text-indigo-300 block mb-2',
            divider: 'bg-slate-800',
          }
        }}
        theme="dark"
        providers={["google"]}
        redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`}
      />
    </div>
  );
}
