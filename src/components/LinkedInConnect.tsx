"use client";

import { useEffect, useState } from "react";
import { Guest } from "@/lib/types";
import LinkedInImport, { LinkedInOAuthProfile } from "./LinkedInImport";
import { GhostButton } from "./ui";

interface Props {
  onImport: (guests: Guest[]) => void;
}

function readProfileCookie(): LinkedInOAuthProfile | null {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie.split("; ").find((c) => c.startsWith("linkedin_profile="));
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

export default function LinkedInConnect({ onImport }: Props) {
  const [profile, setProfile] = useState<LinkedInOAuthProfile | null>(null);
  const [open, setOpen] = useState(false);
  const [connectState, setConnectState] = useState<"idle" | "checking" | "not_configured">(
    "idle"
  );

  useEffect(() => {
    setProfile(readProfileCookie());
  }, []);

  const handleDisconnect = () => {
    document.cookie = "linkedin_profile=; Path=/; Max-Age=0";
    setProfile(null);
  };

  /**
   * LinkedIn sign-in needs LINKEDIN_CLIENT_ID on the server. There's no way to read
   * that from the client, so before doing a full-page navigation to the OAuth start
   * route we probe it with a same-origin fetch using redirect: "manual" — if the
   * route is configured it responds with a redirect (type "opaqueredirect") and we
   * follow through with a real navigation; if it isn't, it responds with a plain
   * JSON error and we show an on-brand hint instead of bouncing the user to a raw
   * error page.
   */
  const handleConnect = async () => {
    setConnectState("checking");
    try {
      const res = await fetch("/api/auth/linkedin", { redirect: "manual" });
      if (res.type === "opaqueredirect" || res.status === 0) {
        window.location.href = "/api/auth/linkedin";
        return;
      }
      setConnectState("not_configured");
    } catch {
      setConnectState("not_configured");
    }
  };

  return (
    <>
      <GhostButton onClick={() => setOpen(true)}>
        {profile ? `LinkedIn · ${profile.firstName}` : "Look up profile"}
      </GhostButton>
      {open && (
        <LinkedInImport
          profile={profile}
          connectState={connectState}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onClose={() => setOpen(false)}
          onImport={(guests) => {
            onImport(guests);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
