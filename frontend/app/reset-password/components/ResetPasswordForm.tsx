"use client"

import { resetPassword } from "@/actions/api/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";

interface FormValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm({ email, token }: { email: string; token: string; }) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(resetPassword, null);

  const [formValues, setFormValues] = useState<FormValues>({ password: "", confirmPassword: "" });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormValues, string>>>({});

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    router.refresh();
  }, [])
  
  function handleBlur(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.name === "password") {
      const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;
      
      if (confirmPassword.dataset.touched)
        setFormErrors(validate(formValues));
    } else if (e.target.name === "confirmPassword") {
      const password = e.target.form?.elements.namedItem("password") as HTMLInputElement;
      
      if (password.dataset.touched)
        setFormErrors(validate(formValues));
    }

    e.target.dataset.touched = "true";
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValues = { ...formValues, [e.target.name]: e.target.value };
    setFormValues(newValues);

    if (e.target.dataset.touched) {
      if (e.target.name === "password") {
        const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;
        
        if (confirmPassword.dataset.touched)
          setFormErrors(validate(newValues));
      } else if (e.target.name === "confirmPassword") {
        const password = e.target.form?.elements.namedItem("password") as HTMLInputElement;
        
        if (password.dataset.touched)
          setFormErrors(validate(newValues));
      }
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isPending) {
      const formData = new FormData(e.currentTarget);
      startTransition(() => formAction(formData));
    }
  }

  function validate(formValues: FormValues) {
    let errors: Partial<Record<keyof FormValues, string>> = {};

    if (formValues.password !== formValues.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    return errors;
  }

  const disableSubmit = useMemo(() => {
    const isIncomplete = !formValues.password.trim() || !formValues.confirmPassword.trim();
    return isIncomplete || !formRef.current?.checkValidity() || Object.values(validate(formValues)).some(e => e);
  }, [formValues]);

  return (
    <form className="grow flex flex-col justify-center" onSubmit={handleSubmit} ref={formRef}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />
      <div className="w-full max-w-4xl mx-auto mb-4.5">
        <div className="peer">
          <label className="block text-sm mb-1" htmlFor="password">Password</label>
          <input 
            className="input text-base w-full peer user-invalid:input-error"
            disabled={state?.success || state?.invalidResetRequest} 
            id="password" 
            name="password" 
            onBlur={handleBlur}
            onChange={handleChange}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$"
            placeholder="Enter the new password" 
            type="password"
            value={formValues.password} 
          />
          <p className="invisible text-xs text-error pt-1 min-h-5 peer-user-invalid:visible">
            Password must be 6+ characters, and contain both an upper and lowercase letter, number, and symbol.
          </p>
        </div>
        <div className={formErrors.confirmPassword ? "peer-has-valid:[&>input]:input-error peer-has-valid:[&>p]:visible" : ""}>
          <label className="block text-sm mb-1" htmlFor="confirmPassword">Confirm password</label>
          <input 
            className="input text-base w-full"
            disabled={state?.success || state?.invalidResetRequest} 
            id="confirmPassword" 
            name="confirmPassword" 
            onBlur={handleBlur}
            onChange={handleChange}
            placeholder="Confirm your password" 
            type="password"
            value={formValues.confirmPassword} 
          />
          <p className="text-xs text-error pt-1 h-5 invisible">{formErrors.confirmPassword}</p>
        </div>
      </div>
      <p className="text-center mb-5 h-9">
        {isPending ? (
          <span className="loading loading-ring loading-lg text-primary" />
        ) : state && state.message && (
          <span className={`${state.success ? "text-success bg-success/15" : "text-error bg-error/15"} inline-block rounded font-medium py-0.5 px-3`}>
            {state.message}
          </span>
        )}
      </p>
      <div className="text-center">
        {state?.success ? (
          <Link className="btn btn-primary" href="/login">Go To Login</Link>
        ) : state?.invalidResetRequest ? (
          <Link className="btn btn-primary" href="/forgot-password">Forgot Password?</Link>
        ) : (
          <button className="btn btn-primary" disabled={disableSubmit}>Reset</button>
        )}
      </div>
    </form>
  );
}