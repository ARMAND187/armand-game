"use client";

import dynamic from "next/dynamic";

const PersistentPartyHUD = dynamic(
  () => import("@/components/PersistentPartyHUD"),
  { ssr: false }
);

export default function PartyHUDLoader() {
  return <PersistentPartyHUD />;
}
