"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignOutPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/logout", { method: "POST" }).finally(() => {
      router.push("/login");
    });
  }, [router]);

  return null;
}
