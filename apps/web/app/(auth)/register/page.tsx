import RegisterForm from "../../../components/RegisterForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join Blueprint today.",
};

export default function RegisterPage() {
  return (
    <div className="flex items-center justify-center">
      <RegisterForm />
    </div>
  );
}
