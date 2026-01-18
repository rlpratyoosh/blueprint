import { serverApi } from "../utils/server-api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const res = await serverApi.get("/");
  const message = res.data;
  return <>{message}</>;
}
