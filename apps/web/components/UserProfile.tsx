"use client";

import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import { useForm } from "react-hook-form";
import { UpdateProfileDto, UpdateProfileSchema } from "@repo/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../utils/client-api";
import { AxiosError } from "axios";

export default function UserProfile() {
  const { user, loading, signOut, error, refetch } = useAuth();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileDto>({
    resolver: zodResolver(UpdateProfileSchema),
  });

  const onSubmit = async (data: UpdateProfileDto) => {
    try {
      // Make sure to clean the data since the form sends empty strings,
      // and you don't want your database messed up.
      const cleanData = {
        displayName: data.displayName || undefined,
        avatarUrl: data.avatarUrl || undefined,
        bio: data.bio || undefined,
      };

      await api.post("/profile/update", cleanData);
      await refetch();
      setEditMode(false);
    } catch (err) {
      if (err instanceof AxiosError) setSubmitError(err.response?.data.message);
    }
  };

  useEffect(() => {
    if (user?.profile) {
      reset({
        displayName: user.profile.displayName || "",
        avatarUrl: user.profile.avatarUrl || "",
        bio: user.profile.bio || "",
      });
    }
  }, [user, reset]);

  if (editMode) {
    return (
      <form onSubmit={handleSubmit(onSubmit)}>
        {submitError && <p>{submitError}</p>}
        <div>
          <input {...register("displayName")} placeholder="Hippopotamus" />
          {errors.displayName && <p>{errors.displayName.message}</p>}
        </div>
        <div>
          <input
            {...register("avatarUrl")}
            placeholder="e.g. https://imgur.com/gallery/something"
          />
          {errors.avatarUrl && <p>{errors.avatarUrl.message}</p>}
        </div>
        <div>
          <textarea
            {...register("bio")}
            placeholder="e.g. I am something and someone from seomwhere..."
          />
          {errors.bio && <p>{errors.bio.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting.. " : "Submit"}
        </button>{" "}
        <br />
        <button type="button" onClick={() => setEditMode(false)}>
          Go Back
        </button>
      </form>
    );
  }

  if (loading) return <>Loading...</>;

  return (
    <div>
      {error && <p>{error}</p>}
      {user && (
        <div>
          Username: {user.username} <br />
          Displayname: {user.profile?.displayName} <br />
          Email: {user.email} <br />
          Bio: {user.profile?.bio} <br />
        </div>
      )}
      <button onClick={() => setEditMode(true)}>Edit Profile</button> <br />
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
