"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";

export default function ChatWindow() {
  const params = useParams();
  const chatId = params.id as string;
  const { getToken } = useAuth();

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to UI immediately
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      // 4. Get the raw JWT from Clerk
      const token = await getToken();

      // 5. Send request directly to FastAPI
      const response = await fetch("http://127.0.0.1:8000/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Inject the token here
        },
        body: JSON.stringify({
          conversation_id: chatId,
          message: input,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FastAPI Error ${response.status}: ${errorText}`);
      }

      // 6. Handle the Stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) return;

      // Create a temporary placeholder for the AI's incoming response
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });

        // Append the new chunk to the last message in the array
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1];
          const updatedMessage = {
            ...lastMessage,
            content: lastMessage.content + chunkValue,
          };
          return [...prev.slice(0, -1), updatedMessage];
        });
      }
    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 border border-neutral-300">
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded ${msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"}`}
          >
            <strong>{msg.role === "user" ? "You" : "AI"}: </strong>
            <span>{msg.content}</span>
          </div>
        ))}
        {isTyping && (
          <div className="text-gray-400 italic">AI is typing...</div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border border-black rounded"
          placeholder="Type your message..."
        />
        <button type="submit" className="px-4 py-2 bg-black text-white rounded">
          Send
        </button>
      </form>
    </div>
  );
}
