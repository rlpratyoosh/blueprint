import UserProfile from "../../components/UserProfile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Profile",
  description: "Manage your account settings and profile.",
};

export default function ProfilePage() {
  return (
    <div>
      <UserProfile />
    </div>
  );
}
