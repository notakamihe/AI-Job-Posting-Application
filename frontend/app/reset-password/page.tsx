import { verifyResetPasswordToken } from "@/actions/api/auth";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./components/ResetPasswordForm";
import { Metadata } from "next";
import { cachedGetAuthUser } from "@/actions/api/user";

export const metadata: Metadata = { title: "Reset Password" }

export default async function ResetPasswordPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  const user = await cachedGetAuthUser();

  if (user)
    redirect("/profile");

  const { email: emailParam = "", token: tokenParam = "" } = await searchParams;
  const email = typeof emailParam === "string" ? emailParam : emailParam[0];
  const token = typeof tokenParam === "string" ? tokenParam : tokenParam[0];

  if (!email || !token)
    redirect("/login");

  const isTokenValid = (await verifyResetPasswordToken(email, token)).success;

  if (!isTokenValid)
    redirect("/login");

  return (
    <div className="flex flex-col h-full py-7 px-5 font-(family-name:--font-geist-sans) md:px-7">
      <h1 className="text-2xl font-bold text-center mb-10">Password Reset</h1>
      <ResetPasswordForm email={email} token={token} />
    </div>
  );
}