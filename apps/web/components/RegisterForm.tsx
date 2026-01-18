"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterUserDto, RegisterUserSchema } from "@repo/schema";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { api } from "../utils/client-api";
import { AxiosError } from "axios";

export default function RegisterForm() {
  const [error, setError] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [sentOtp, setSentOtp] = useState<boolean>(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterUserDto>({
    resolver: zodResolver(RegisterUserSchema),
  });

  const onSubmit = async (data: RegisterUserDto) => {
    setUsername(data.username);
    setPassword(data.password);
    try {
      await api.post("/auth/register", data);
      setSentOtp(true);
    } catch (err) {
      if (err instanceof AxiosError)
        setError(err.response?.data.message as string);
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
      if (err instanceof AxiosError)
        setError(err.response?.data.message as string);
    }
  };

  if (sentOtp) {
    return (
      <form onSubmit={onOtpSubmit}>
        {error && <p>{error}</p>}
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="e.g. 1234"
        />
        <button type="submit">Login</button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <p>{error}</p>}
      <div>
        <input {...register("username")} placeholder="e.g. hippo" />
        {errors.username && <p>{errors.username.message}</p>}
      </div>
      <div>
        <input {...register("email")} placeholder="e.g. hippo@mail.com" />
        {errors.email && <p>{errors.email.message}</p>}
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
        {isSubmitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
