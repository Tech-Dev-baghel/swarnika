import { Suspense } from "react";
import TrackClient from "./TrackClient";

export const metadata = { title: "Track Your Order — Swarnika Jewels" };

export default function Page() {
  return <Suspense><TrackClient /></Suspense>;
}
