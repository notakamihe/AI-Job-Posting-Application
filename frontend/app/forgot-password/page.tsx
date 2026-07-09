import { cachedGetAuthUser } from "@/actions/api/user";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import ForgotPasswordForm from "./components/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function ForgotPasswordPage() {
  const user = await cachedGetAuthUser();

  if (user)
    redirect("/profile");

  return (
    <div className="flex flex-col h-full py-7 px-5 font-(family-name:--font-geist-sans) md:px-7">
      <h1 className="text-center text-2xl font-bold justify-self-start gap-5">Forgot Password</h1>
      <ForgotPasswordForm />
    </div>
  );
}