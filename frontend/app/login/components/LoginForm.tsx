"use client"

import { login } from "@/actions/api/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";

export default function LoginForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(login, null);
  const [formValues, setFormValues] = useState({ email: "", password: "" });
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setFormValues({ ...formValues, email: sessionStorage.getItem("prefillEmail") ?? "" });
    router.refresh();
  }, [])

  useEffect(() => {
    sessionStorage.setItem("prefillEmail", formValues.email);
  }, [formValues.email])
  
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isPending && !state?.success) {
      const formData = new FormData(e.currentTarget);
      startTransition(() => formAction(formData));
    }
  }

  const disableSubmit = useMemo(() => {
    return !formValues.email.trim() || !formValues.password.trim() || !ref.current?.checkValidity();
  }, [formValues])

  return (
    <div className="grow flex justify-center items-center">
      <form className="max-w-4xl w-full" onSubmit={handleSubmit} ref={ref}>
        <div className="relative">
          <label className="text-sm block mb-1" htmlFor="email">Email</label>
          <input 
            className="input text-base w-full peer user-invalid:input-error" 
            id="email"
            name="email"
            onChange={e => setFormValues({ ...formValues, email: e.target.value })}
            placeholder="email@example.com" 
            type="email"
            value={formValues.email}
          />
          <p className="invisible text-xs text-error pt-1 min-h-5.5 peer-user-invalid:visible">Email is invalid.</p>
        </div>
        <div className="mb-5">
          <label className="text-sm block mb-1" htmlFor="password">Password</label>
          <input 
            className="input text-base w-full peer" 
            id="password"
            name="password"
            onChange={e => setFormValues({ ...formValues, password: e.target.value })}
            placeholder="Enter password" 
            type="password"
            value={formValues.password} 
          />
          <p className="text-right text-sm mt-2">
            <Link className="text-primary font-bold" href="/forgot-password">Forgot password?</Link>
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
          <button className="btn btn-primary" disabled={disableSubmit || state?.success}>Log in</button>
        </div>
      </form>
    </div>
  );
}