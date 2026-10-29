import { ArrowRight, BookOpenText, Feather, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../lib/api";

export function LoginPage({ mode, portal = "author" }: { mode: "login" | "signup"; portal?: "author" | "admin" }) {
  const { login, loginAdmin, signup } = useAuth();
  const isSignup = mode === "signup";
  const isAdmin = portal === "admin";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignup && password !== confirmPassword) {
      toast.error("Your passwords don’t match.");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) await signup(fullName.trim(), email.trim(), password);
      else if (isAdmin) await loginAdmin(email.trim(), password);
      else await login(email.trim(), password);
      toast.success(isSignup ? "Your author account is ready. Welcome to BookLeaf!" : isAdmin ? "Signed in to the admin portal." : "Welcome back!");
    } catch (reason) {
      const message = reason instanceof ApiError && reason.status === 401
        ? (isAdmin ? "We couldn’t find an administrator account with those details." : "We couldn’t find an author account with those details.")
        : reason instanceof Error
          ? reason.message
          : isSignup ? "Account creation failed. Please try again." : "Sign in failed. Please try again.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7f4] md:grid md:grid-cols-[minmax(340px,0.95fr)_1.05fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#153e34] px-12 py-10 text-white md:flex md:flex-col lg:px-16">
        <div className="absolute -right-40 top-16 h-[480px] w-[480px] rounded-full border border-white/[0.08]" />
        <div className="absolute -right-24 top-32 h-[360px] w-[360px] rounded-full border border-white/[0.08]" />
        <div className="absolute -bottom-32 -left-20 h-[420px] w-[420px] rounded-full border border-white/[0.07]" />
        <div className="relative flex items-center gap-3"><span className="brand-mark"><Feather size={20} /></span><span className="text-lg font-semibold tracking-tight">bookleaf</span></div>
        <div className="relative my-auto max-w-xl py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-xs font-medium text-emerald-100"><Sparkles size={14} />Made for your next chapter</span>
          <h1 className="mt-7 text-4xl font-semibold leading-[1.12] tracking-[-0.045em] lg:text-[52px]">A little space for the stories you bring to life.</h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/60">Keep your books close, follow your publishing progress, and get help from the BookLeaf team whenever you need it.</p>
          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-white/75"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.09] text-emerald-100"><BookOpenText size={17} /></span>Your books and publishing details in one place</div>
            <div className="flex items-center gap-3 text-sm text-white/75"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.09] text-emerald-100"><ShieldCheck size={17} /></span>Private support conversations for your account</div>
          </div>
        </div>
        <p className="relative text-xs text-white/35">BookLeaf Author Studio · Your writing journey, thoughtfully supported.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-10 md:hidden"><div className="flex items-center gap-3"><span className="brand-mark bg-[#153e34] text-white"><Feather size={19} /></span><span className="text-lg font-semibold tracking-tight text-[#294234]">bookleaf</span></div><p className="mt-5 text-sm text-[#859087]">{isAdmin ? "Administrator portal" : "Author Studio"}</p></div>
          <div className="mb-8">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#77917d]">{isSignup ? "Join BookLeaf" : isAdmin ? "Administrator sign in" : "Welcome back"}</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-[#233a2e]">{isSignup ? "Create your author account" : isAdmin ? "Sign in to the admin portal" : "Sign in to your portal"}</h2>
            <p className="mt-2 text-sm leading-6 text-[#7f8b82]">{isSignup ? "Set up an account to follow your books and support conversations." : isAdmin ? "Use your administrator account credentials." : "Use the email and password linked to your author account."}</p>
          </div>
          <form onSubmit={submit} className="space-y-5">
            {isSignup && <div><label className="form-label" htmlFor="fullName">Full name</label><input id="fullName" className="field-input mt-2" type="text" autoComplete="name" minLength={2} maxLength={120} required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" /></div>}
            <div><label className="form-label" htmlFor="email">Email address</label><input id="email" className="field-input mt-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
            <div><div className="flex items-center justify-between"><label className="form-label" htmlFor="password">Password</label>{isSignup && <span className="text-[10px] text-[#9aa49c]">At least 12 characters</span>}</div><input id="password" className="field-input mt-2" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : undefined} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder={isSignup ? "Create a password" : "Your password"} /></div>
            {isSignup && <div><label className="form-label" htmlFor="confirmPassword">Confirm password</label><input id="confirmPassword" className="field-input mt-2" type="password" autoComplete="new-password" minLength={12} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" /></div>}
            <button className="button-primary w-full justify-center py-3.5" disabled={submitting} type="submit">{submitting ? isSignup ? "Creating account…" : "Signing in…" : isSignup ? "Create account" : "Sign in"}<ArrowRight size={16} /></button>
          </form>
          {!isAdmin && <p className="mt-6 text-center text-sm text-[#7f8b82]">{isSignup ? "Already have an account?" : "New to BookLeaf?"} <Link className="font-semibold text-[#456f4e] hover:text-[#2f5438]" to={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an author account"}</Link></p>}
          {!isSignup && <div className="mt-6 flex gap-3 rounded-2xl border border-[#e5ebe4] bg-white p-4"><ShieldCheck className="mt-0.5 shrink-0 text-[#68876a]" size={17} /><p className="text-xs leading-5 text-[#829087]">{isAdmin ? "Administrator access is limited to authorized BookLeaf staff." : "This portal is for BookLeaf authors. Need help accessing your account? Contact your BookLeaf administrator."}</p></div>}
          <p className="mt-8 text-center text-[11px] text-[#a1aaa3]">© {new Date().getFullYear()} BookLeaf. All rights reserved.</p>
        </div>
      </section>
    </main>
  );
}
