"use client";

import { Prisma } from "@repo/db";
import { useCallback, useEffect, useState } from "react";
import { api } from "../utils/client-api";
import { AxiosError } from "axios";

type UserWProfile = Omit<
  Prisma.UserGetPayload<{
    include: {
      profile: true;
    };
  }>,
  "password"
>;

export default function useAuth() {
  const [user, setUser] = useState<UserWProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      if (err instanceof AxiosError) setError(err.response?.data.message);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  return {
    user,
    loading,
    signOut,
    error,
    refetch: fetchUser,
  };
}
