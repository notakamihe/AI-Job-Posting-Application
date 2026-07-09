"use client"

import { deleteAccount, changePassword } from "@/actions/api/auth";
import { updateUserEmail, updateUserPhoneNumber } from "@/actions/api/user";
import { AuthenticatedUser, ChangePasswordFormData, FormState } from "@/types";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { preventSubmitOnEnter } from "@/utils/utils";

interface AccountDeletionProps {
  onClick: (e: React.MouseEvent) => void;
  onConfirm: (password: string) => void;
}

function AccountDeletion({ onClick, onConfirm }: AccountDeletionProps) {
  const [flipDropdown, setFlipDropdown] = useState(false);
  const [formData, setFormData] = useState({ acknowledge: false, password: "" });
  const [key, setKey] = useState(0);

  const ref = useRef<HTMLFormElement>(null);

  const disableSubmit = useMemo(() => {
    return !formData.acknowledge || !formData.password.trim() || !ref.current?.checkValidity();
  }, [formData.password])
  
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
      setFormData({ acknowledge: false, password: "" });
      setKey(key + 1);
    }
  }

  function handleFocus(e: React.FocusEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    setFlipDropdown(window.innerHeight - rect.bottom < 325);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); 
    
    if (document.activeElement)
      (document.activeElement as HTMLElement).blur();

    onConfirm(formData.password);
  }

  return (
    <div
      className={`dropdown ${flipDropdown ? "max-md:dropdown-top" : ""} md:dropdown-right md:block shrink-0`} 
      onBlur={handleBlur}
    >
      <div 
        className="btn btn-error btn-outline pointer-events-auto! m-2 ml-0" 
        onClick={onClick}
        onFocus={handleFocus} 
        role="button" 
        tabIndex={0}
      >
        Delete Account
      </div>
      <form 
        className={`dropdown-content menu bg-base-100 rounded-box z-1 w-77 p-3 shadow-sm md:-translate-y-1/2`}
        onKeyDown={preventSubmitOnEnter}
        onSubmit={handleSubmit}
        tabIndex={-1}
        ref={ref}
      >
        <h2 className="font-medium text-[0.95rem] mb-3">
          Confirm the deletion of your account. This is an irreversible action.
        </h2>
        <div className="mb-3">
          <input 
            checked={formData.acknowledge}
            className="checkbox checkbox-primary checkbox-sm rounded"
            id="acknowledge"
            onChange={e => setFormData({ ...formData, acknowledge: e.target.checked })}
            type="checkbox" 
          />
          <label htmlFor="acknowledge" className="ml-2 align-middle text-sm">
            I acknowledge this.
          </label>
        </div>
        <div>
          <label className="block mb-1" htmlFor="confirmPassword">Enter your password</label>
          <input 
            className="input text-base peer user-invalid:input-error" 
            name="confirmPassword"
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            key={key}
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$"
            type="password" 
            value={formData.password}
          />
          <p className="invisible text-xs text-error pt-1 h-5.5 peer-user-invalid:h-auto peer-user-invalid:visible">
            Password must be 6+ characters, and contain both an upper and lowercase letter, number, and symbol.
          </p>
        </div>
        <button className="btn btn-error mt-1" disabled={disableSubmit}>Confirm</button>
      </form>
    </div>
  )
}

type ChangePasswordFormErrors = Partial<Record<keyof ChangePasswordFormData, string>>;

enum SettingsAction {
  UpdateEmail,
  UpdatePhone,
  ChangePassword,
  DeleteAccount
}

export default function AccountSettings({ user }: { user: AuthenticatedUser }) {
  const [action, setAction] = useState<SettingsAction | null>(null);
  const [changePasswordFormData, setChangePasswordFormData] = useState({ 
    password: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [changePasswordFormErrors, setChangePasswordFormErrors] = useState<ChangePasswordFormErrors>({});
  const [email, setEmail] = useState(user.email);
  const [emailText, setEmailText] = useState(user.email);
  const [formState, setFormState] = useState<FormState | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber);
  const [phoneNumberText, setPhoneNumberText] = useState(user.phoneNumber);
  const [showForms, setShowForms] = useState({ email: false, phoneNumber: false, changePassword: false });

  const emailFormRef = useRef<HTMLFormElement>(null);
  const phoneNumberFormRef = useRef<HTMLFormElement>(null);
  const changePasswordFormRef = useRef<HTMLFormElement>(null);

  const disableEmailSubmit = useMemo(() => !emailFormRef.current?.checkValidity() || !emailText.trim(), [emailText]);
  
  const disablePhoneNumberSubmit = useMemo(() => {
    return !phoneNumberFormRef.current?.checkValidity() || !phoneNumberText.trim();
  }, [phoneNumberText]);

  const disableChangePasswordSubmit = useMemo(() => {
    if (
      !changePasswordFormData.password.trim() || 
      !changePasswordFormData.newPassword.trim() || 
      !changePasswordFormData.confirmPassword.trim()
    )
      return true;
    
    if (!changePasswordFormRef.current?.checkValidity())
      return true;
    if (Object.values(validateChangePassword(changePasswordFormData)).some(e => e))
      return true;
    
    return false;
  }, [changePasswordFormData]);

  useEffect(() => {
    setEmail(user.email);
    setPhoneNumber(user.phoneNumber);
  }, [user.email, user.phoneNumber])

  function cancelChangePassword() {
    setShowForms({ ...showForms, changePassword: false });
    setChangePasswordFormData({ password: "", newPassword: "", confirmPassword: "" });
    setChangePasswordFormErrors({});
    setFormState(action === SettingsAction.ChangePassword ? null : formState);
  }

  function cancelEmailEdit() {
    setShowForms({ ...showForms, email: false });
    setEmailText(email);
    setFormState(action === SettingsAction.UpdateEmail ? null : formState);
  }

  function cancelPhoneNumberEdit() {
    setShowForms({ ...showForms, phoneNumber: false });
    setPhoneNumberText(phoneNumber);
    setFormState(action === SettingsAction.UpdatePhone ? null : formState);
  }

  function confirmDeletion(password: string) {
    if (!isPending) {
      setIsPending(true);
      setAction(SettingsAction.DeleteAccount);
      
      deleteAccount(password)
        .then(result => {
          setIsPending(false);
          setFormState(result);
        });
    }
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    if (e.target.name === "confirmPassword") {
      const newPassword = e.target.form?.elements.namedItem("newPassword") as HTMLInputElement;
      
      if (newPassword.dataset.touched)
        setChangePasswordFormErrors(validateChangePassword(changePasswordFormData));
    } else if (e.target.name === "newPassword") {
      const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;

      if (confirmPassword.dataset.touched)
        setChangePasswordFormErrors(validateChangePassword(changePasswordFormData));
    }
    
    e.target.dataset.touched = "true";
  }

  function handleChangePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newFormData = { ...changePasswordFormData, [e.target.name]: e.target.value };

    setFormState(null);
    setChangePasswordFormData(newFormData);
    
    if (e.target.dataset.touched) {
      if (e.target.name === "confirmPassword") {
        const newPassword = e.target.form?.elements.namedItem("newPassword") as HTMLInputElement;
        
        if (newPassword.dataset.touched)
          setChangePasswordFormErrors(validateChangePassword(newFormData));
      } else if (e.target.name === "newPassword") {
        const confirmPassword = e.target.form?.elements.namedItem("confirmPassword") as HTMLInputElement;

        if (confirmPassword.dataset.touched)
          setChangePasswordFormErrors(validateChangePassword(newFormData));
      }
    }
  }

  function handleChangePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isPending) {
      setIsPending(true);
      setAction(SettingsAction.ChangePassword);

      changePassword(changePasswordFormData)
        .then(result => {
          if (result.success) {
            setShowForms({ ...showForms, changePassword: false });
            setChangePasswordFormData({ password: "", newPassword: "", confirmPassword: "" });
          }

          setIsPending(false);
          setFormState(result);
        });
    }
  }

  function updateEmail(e: React.FormEvent) {
    e.preventDefault();

    if (!isPending) {
      setIsPending(true);
      setAction(SettingsAction.UpdateEmail);

      updateUserEmail(user.id, emailText)
        .then(result => {
          if (result.success) {
            setEmail(emailText);
            setShowForms(prev => ({ ...prev, email: false }));
          }

          setIsPending(false);
          setFormState(result);
        });
    }
  }

  function updatePhoneNumber(e: React.FormEvent) {
    e.preventDefault();

    if (!isPending) {
      setIsPending(true);
      setAction(SettingsAction.UpdatePhone);

      updateUserPhoneNumber(user.id, phoneNumberText)
        .then(result => {
          if (result.success) {
            setPhoneNumber(phoneNumberText);
            setShowForms(prev => ({ ...prev, phoneNumber: false }));
          }

          setIsPending(false);
          setFormState(result);
        });
    }
  }

  function validateChangePassword(formData: ChangePasswordFormData) {
    let errors: ChangePasswordFormErrors = {};

    if (formData.newPassword !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match.";

    return errors;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="font-bold mb-1">Email</p>
        {showForms.email ? (
          <form 
            className="flex justify-end items-center flex-wrap gap-x-5 gap-y-3" 
            onSubmit={updateEmail} 
            ref={emailFormRef}
          >
            <div className="grow relative">
              <input 
                className="w-full text-base input peer user-invalid:input-error" 
                maxLength={256}
                name="email"
                onChange={e => { setEmailText(e.target.value); }}
                type="email" 
                value={emailText} 
              />
              <p className="invisible absolute bottom-0 translate-y-full text-xs text-error pt-1 peer-user-invalid:visible">
                Email is invalid.
              </p>
            </div>
            <div>
              <button className="btn btn-outline btn-primary mr-3 w-21" disabled={disableEmailSubmit}>
                {
                  isPending && action === SettingsAction.UpdateEmail 
                    ? <span className="loading loading-sm loading-ring" />
                    : "Update"
                }
              </button>
              <button className="btn" onClick={cancelEmailEdit} type="button">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end items-center flex-wrap gap-x-5 gap-y-4">
            <p className="grow">{email}</p>
            <button 
              className="btn btn-outline btn-neutral" 
              onClick={() => { setShowForms({ ...showForms, email: true }); setFormState(null); }}
            >
              Change
            </button>
          </div>
        )}
        {!isPending && formState?.message && action === SettingsAction.UpdateEmail && (
          <p className={`mt-3 ml-auto text-right w-fit ${formState.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} rounded font-medium py-1 px-3 self-end`}>
            {formState.message}
          </p>
        )}
      </div>
      <div className="mb-8">
        <p className="font-bold mb-1">Phone Number</p>
        {showForms.phoneNumber ? (
          <form 
            className="flex justify-end items-center flex-wrap gap-x-5 gap-y-4" 
            onSubmit={updatePhoneNumber} 
            ref={phoneNumberFormRef}
          >
            <div className="grow relative">
              <input 
                className="tabular-nums input w-full text-base peer max-w-3xs user-invalid:input-error" 
                maxLength={16}
                name="phoneNumber"
                onChange={e => { setPhoneNumberText(e.target.value.replace(/[^\d+]/g, "")); setFormState(null); }}
                pattern="^\+\d{9,15}$"
                placeholder="+11234567890"
                type="tel" 
                value={phoneNumberText}
              />
              <p className="invisible absolute bottom-0 translate-y-full text-xs text-error pt-1 peer-user-invalid:visible">
                Phone number is invalid.
              </p>
            </div>
            <div>
              <button className="btn btn-outline btn-primary mr-3 w-21" disabled={disablePhoneNumberSubmit}>
                {
                  isPending && action === SettingsAction.UpdatePhone 
                    ? <span className="loading loading-sm loading-ring" />
                    : "Update"
                }
              </button>
              <button className="btn" onClick={cancelPhoneNumberEdit} type="button">Cancel</button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end items-center flex-wrap gap-x-5 gap-y-4">
            <p className="grow">{phoneNumber}</p>
            <button 
              className="btn btn-outline btn-neutral" 
              onClick={() => { setShowForms({ ...showForms, phoneNumber: true }); setFormState(null); }} 
            >
              Change
            </button>
          </div>
        )}
        {!isPending && formState?.message && action === SettingsAction.UpdatePhone && (
          <p className={`mt-3 ml-auto text-right w-fit ${formState.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} rounded font-medium py-1 px-3 self-end`}>
            {formState.message}
          </p>
        )}
      </div>
      <div className="mb-3">
        {showForms.changePassword ? (
          <>
            <p className="font-bold mb-2">Change Password</p>
            <form 
              className="flex flex-col justify-end gap-x-5 gap-y-2 xs:flex-row" 
              onSubmit={handleChangePasswordSubmit}
              ref={changePasswordFormRef}
            >
              <div className="grow">
                <div className="flex-1">
                  <label className="block text-sm mb-1" htmlFor="password">Current password</label>
                  <input 
                    className="input w-full peer user-invalid:input-error"
                    id="password" 
                    onChange={handleChangePasswordChange} 
                    name="password"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$"
                    placeholder="Enter your current password"
                    type="password" 
                    value={changePasswordFormData.password} 
                  />
                  <p className="invisible text-xs text-error pt-1 h-5 peer-user-invalid:h-auto peer-user-invalid:visible">
                    Password must be 6+ characters, and contain both an upper and lowercase letter, number, and symbol.
                  </p>
                </div>
                <div className="flex-1 peer">
                  <label className="block text-sm mb-1" htmlFor="newPassword">New password</label>
                  <input 
                    className="input w-full peer user-invalid:input-error"
                    id="newPassword" 
                    onBlur={handleBlur}
                    onChange={handleChangePasswordChange} 
                    name="newPassword"
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$"
                    placeholder="Enter the new password"
                    type="password" 
                    value={changePasswordFormData.newPassword}
                  />
                  <p className="invisible text-xs text-error pt-1 h-5 peer-user-invalid:h-auto peer-user-invalid:visible">
                    Password must be 6+ characters, and contain both an upper and lowercase letter, number, and symbol.
                  </p>
                </div>
                <div className={`flex-1 ${changePasswordFormErrors.confirmPassword ? "peer-has-valid:[&>input]:input-error peer-has-valid:[&>p]:visible" : ""}`}>
                  <label className="block text-sm mb-1" htmlFor="confirmPassword">Confirm new password</label>
                  <input 
                    className="input w-full"
                    id="confirmPassword" 
                    name="confirmPassword"
                    onBlur={handleBlur}
                    onChange={handleChangePasswordChange}  
                    placeholder="Confirm the new password"
                    type="password"
                    value={changePasswordFormData.confirmPassword}
                  />
                  <p className="text-xs text-error pt-1 h-5 invisible">{changePasswordFormErrors.confirmPassword}</p>
                </div>
              </div>
              <div className="flex gap-3 flex-row self-end xs:flex-col xs:self-start xs:mt-6">
                <button className="btn btn-primary btn-outline w-21" disabled={disableChangePasswordSubmit}>
                  {
                    isPending && action === SettingsAction.ChangePassword 
                      ? <span className="loading loading-sm loading-ring" />
                      : "Update"
                  }
                </button>
                <button className="btn" onClick={cancelChangePassword} type="button">Cancel</button>
              </div>
            </form>
          </>
        ) : (
          <button 
            className="btn btn-outline btn-neutral" 
            onClick={() => { setShowForms({ ...showForms, changePassword: true }); setFormState(null); }}
          >
            Change Password
          </button>
        )}
        {!isPending && formState?.message && action === SettingsAction.ChangePassword && (
          <p className={`mt-3 ml-auto text-right w-fit ${formState.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} rounded font-medium py-1 px-3 self-end`}>
            {formState.message}
          </p>
        )}
      </div>
      <div className="flex justify-between items-center gap-5 gap-y-1 flex-wrap">
        <AccountDeletion onClick={() => setFormState(null)} onConfirm={confirmDeletion} />
        {isPending && action === SettingsAction.DeleteAccount ? (
          <span className="loading loading-lg loading-ring text-primary" />
        ) : formState?.message && action === SettingsAction.DeleteAccount && (
          <span className={`${formState.success ? "bg-success/15 text-success" : "bg-error/15 text-error"} rounded font-medium py-1 px-3 w-fit`}>
            {formState.message}
          </span>
        )}
      </div>
    </div>
  )
}