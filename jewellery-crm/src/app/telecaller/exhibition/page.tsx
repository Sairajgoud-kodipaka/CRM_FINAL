"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TelecallerExhibitionPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main exhibition page
    router.push('/exhibition');
  }, [router]);

  return (
    <div className="p-6">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}
