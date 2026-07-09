import { cachedGetAuthUser } from "@/actions/api/user";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import LoginForm from "./components/LoginForm";

export const metadata: Metadata = { title: "Log In" };

export default async function LoginPage() {
  const user = await cachedGetAuthUser();

  if (user)
    redirect("/profile");

  return (
    <div className="flex flex-col h-full py-7 px-5 font-(family-name:--font-geist-sans) md:px-7">
      <h1 className="text-center text-2xl font-bold justify-self-start gap-5">Login</h1>
      <LoginForm />
    </div>
  );
}