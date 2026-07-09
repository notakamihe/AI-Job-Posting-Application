"use client"

import { forgotPassword } from "@/actions/api/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(forgotPassword, null);
  const [email, setEmail] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setEmail(sessionStorage.getItem("prefillEmail") ?? "");
    router.refresh();
  }, [])

  useEffect(() => {
    sessionStorage.setItem("prefillEmail", email);
  }, [email])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  const disableSubmit = useMemo(() => !email.trim() || !formRef.current?.checkValidity(), [email]);

  return (
    <div className="grow flex justify-center items-center">
      <form className="max-w-4xl w-full" onSubmit={handleSubmit} ref={formRef}>
        <div className="relative mb-5">
          <label className="text-sm block mb-1" htmlFor="email">Email</label>
          <input 
            className="input text-base w-full peer user-invalid:input-error" 
            id="email"
            name="email"
            onChange={e => setEmail(e.target.value)}
            placeholder="email@example.com" 
            type="email"
            value={email}
          />
          <p className="hidden text-xs text-error pt-2 min-h-5.5 peer-user-invalid:block">Email is invalid.</p>
          <p className="text-xs opacity-60 pt-2 min-h-5.5 peer-user-invalid:hidden">
            The provided email will be notified about your password reset request.
          </p>
        </div>
        <div className="h-9 mb-5 flex justify-center items-center">
          {isPending ? (
            <span className="loading loading-ring loading-lg text-primary" />
          ) : state && state.message && (
            <span className={`${state.success ? "text-success bg-success/15" : "text-error bg-error/15"} rounded font-medium py-0.5 px-3`}>
              {state.message} 
            </span>
          )}        
        </div>
        <div className="text-center">
          <button className="btn btn-primary mr-4" disabled={disableSubmit}>Send</button>
          <Link className="btn" href="/login" type="button">Back to Login</Link>
        </div>
      </form>
    </div>
  );
}