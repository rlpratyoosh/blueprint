import LoginForm from "../../../components/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Blueprint account.",
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center">
      <LoginForm />
    </div>
  );
}
