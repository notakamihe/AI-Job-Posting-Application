import { cachedGetAuthUser } from "@/actions/api/user";
import { redirect } from "next/navigation";
import RegisterForm from "./components/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = { title: "Create an Account" };

export default async function RegisterPage() {
  const user = await cachedGetAuthUser(); 

  if (user)
    redirect("/profile");

  return (
    <div className="flex flex-col grow py-7 px-5 font-(family-name:--font-geist-sans) md:px-10">
      <h1 className="text-center text-2xl font-bold mb-5">Register</h1>
      <RegisterForm />
    </div>
  );
}