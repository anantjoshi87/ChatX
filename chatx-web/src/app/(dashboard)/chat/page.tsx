"use client";

import { useRouter } from "next/navigation";

export default function NewChatLandingPage() {
  const router = useRouter();

  const handleStartChat = () => {
    const newChatId = crypto.randomUUID();
    router.push(`/chat/${newChatId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <h2 className="text-2xl font-bold">Welcome to ChatX</h2>
      <p className="text-gray-500">
        Start a new intelligent conversation string.
      </p>
      <button
        onClick={handleStartChat}
        className="px-6 py-3 bg-black text-white rounded hover:bg-neutral-800 transition"
      >
        + Create New Chat
      </button>
    </div>
  );
}
