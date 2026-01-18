"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoginUserDto, LoginUserSchema } from "@repo/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { api } from "../utils/client-api";
import { AxiosError } from "axios";

export default function LoginForm() {
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginUserDto>({
    resolver: zodResolver(LoginUserSchema),
  });

  const onSubmit = async (data: LoginUserDto) => {
    setUsername(data.username);
    setPassword(data.password);
    try {
      await api.post("/auth/sendotp", data);
      setOtpSent(true);
    } catch (err) {
      if (err instanceof AxiosError) setError(err.response?.data.message);
    }
  };

  const onOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/auth/login", {
        username,
        password,
        otp,
      });
      router.push("/");
    } catch (err) {
      if (err instanceof AxiosError) setError(err.response?.data.message);
    }
  };

  if (otpSent) {
    return (
      <form onSubmit={onOtpSubmit}>
        {error && <p>{error}</p>}
        <input
          type="text"
          placeholder="e.g. 1234"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register("username")} placeholder="e.g. hippo" />
        {errors.username && <p>{errors.username.message}</p>}
      </div>
      <div>
        <input
          type="password"
          {...register("password")}
          placeholder="e.g. ******"
        />
        {errors.password && <p>{errors.password.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Logging In..." : "Log In"}
      </button>
      {error && <p>{error}</p>}
    </form>
  );
}
