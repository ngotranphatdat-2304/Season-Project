"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAdmin, registerAdmin } from "@/lib/admin/auth";

type AuthMode = "login" | "register";

function readErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const response = error.response as {
      data?: {
        error?: {
          message?: string;
        };
      };
    };

    return response.data?.error?.message ?? "Request failed";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed";
}

export default function AdminAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/admin", [searchParams]);
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminSecret: "",
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(217,203,178,0.32),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(204,191,168,0.22),transparent_20%),linear-gradient(180deg,#faf7f1_0%,#f2ece3_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <section className="w-full max-w-[460px] rounded-[2.25rem] border border-black/8 bg-[#fcfaf6] p-7 shadow-[0_24px_80px_rgba(59,45,28,0.12)] md:p-9">
          <div className="inline-flex rounded-full border border-black/8 bg-[#f1eadf] p-2 text-[#1d1d1d]">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="mt-6 w-full">
            <p className="w-full font-afacad text-xs uppercase tracking-[0.34em] text-black/40">
              Season Admin
            </p>
            <h1 className="mt-3 w-full text-balance font-serif text-4xl leading-tight text-[#171717]">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="mt-3 w-full max-w-none font-afacad text-[16px] leading-7 text-black/58">
              {mode === "login"
                ? "Use your admin credentials to open the dashboard."
                : "Create an admin user with the backend registration secret."}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 rounded-full border border-black/8 bg-[#efe7da] p-1">
            {(["login", "register"] as const).map((item) => (
              <button
                key={item}
                type="button"
                className={`rounded-full px-4 py-3 font-afacad text-sm uppercase tracking-[0.18em] transition-colors ${
                  mode === item
                    ? "bg-white text-black shadow-[0_6px_18px_rgba(59,45,28,0.08)]"
                    : "text-black/42 hover:text-black"
                }`}
                onClick={() => {
                  setMode(item);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <form
            className="mt-8 space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setIsSubmitting(true);
              setErrorMessage(null);
              setSuccessMessage(null);

              const action =
                mode === "login"
                  ? loginAdmin({
                      email: formData.email,
                      password: formData.password,
                    })
                  : registerAdmin({
                      name: formData.name,
                      email: formData.email,
                      password: formData.password,
                      adminSecret: formData.adminSecret,
                    });

              void action
                .then(() => {
                  if (mode === "login") {
                    router.replace(next);
                    return;
                  }

                  setMode("login");
                  setSuccessMessage("Admin account created. Please sign in.");
                  setFormData((current) => ({
                    ...current,
                    password: "",
                    adminSecret: "",
                  }));
                })
                .catch((error: unknown) => {
                  setErrorMessage(readErrorMessage(error));
                })
                .finally(() => {
                  setIsSubmitting(false);
                });
            }}
          >
            {mode === "register" ? (
              <Input
                placeholder="Full name"
                value={formData.name}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    name: event.target.value,
                  }));
                }}
                required
                className="h-12 rounded-2xl border-black/10 bg-white px-4 font-afacad"
              />
            ) : null}

            <Input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(event) => {
                setFormData((current) => ({
                  ...current,
                  email: event.target.value,
                }));
              }}
              required
              className="h-12 rounded-2xl border-black/10 bg-white px-4 font-afacad"
            />

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={formData.password}
                onChange={(event) => {
                  setFormData((current) => ({
                    ...current,
                    password: event.target.value,
                  }));
                }}
                required
                className="h-12 rounded-2xl border-black/10 bg-white px-4 pr-12 font-afacad"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center text-black/40 transition-colors hover:text-black"
                onClick={() => {
                  setShowPassword((current) => !current);
                }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {mode === "register" ? (
              <div className="relative">
                <Input
                  type={showAdminSecret ? "text" : "password"}
                  placeholder="Admin registration secret"
                  value={formData.adminSecret}
                  onChange={(event) => {
                    setFormData((current) => ({
                      ...current,
                      adminSecret: event.target.value,
                    }));
                  }}
                  required
                  className="h-12 rounded-2xl border-black/10 bg-white px-4 pr-12 font-afacad"
                />
                <button
                  type="button"
                  aria-label={showAdminSecret ? "Hide secret" : "Show secret"}
                  className="absolute inset-y-0 right-3 flex items-center text-black/40 transition-colors hover:text-black"
                  onClick={() => {
                    setShowAdminSecret((current) => !current);
                  }}
                >
                  {showAdminSecret ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : null}

            {errorMessage !== null ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage !== null ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-[#171717] text-base font-semibold text-white hover:bg-[#2a2a2a]"
            >
              {isSubmitting
                ? "Processing..."
                : mode === "login"
                  ? "Open admin dashboard"
                  : "Create admin account"}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
