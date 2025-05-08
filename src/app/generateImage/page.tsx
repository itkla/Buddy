"use client";

import { useChat } from "@ai-sdk/react";
import SectionTitle from "@/components/layout/SectionTitle";
import { Trash2, Pencil, RotateCcw } from "lucide-react";

const title = "Image Generation";
const description =
  "Use tool invocation to generate images, and save them locally.";

export default function Page() {
  const {
    messages,
    setMessages,
    status,
    input,
    stop,
    reload,
    handleInputChange,
    handleSubmit,
    error,
  } = useChat({
    api: "/api/generateImage",
  });

  const handleEdit = (id: string) => {
    setMessages(
      messages.map((message) =>
        message.id === id ? { ...message, content: input } : message
      )
    );
    reload();
  };

  const handleDelete = (id: string) => {
    setMessages(messages.filter((message) => message.id !== id));
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full min-h-screen w-full max-w-4xl mx-auto p-2">
      <SectionTitle title={title} description={description} />
      <div className="flex flex-col justify-center border w-full p-2 text-justify">
        {messages.length === 0 ? (
          <div className="p-2 border">
            <p className="text-zinc-500">Chat Area</p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="p-2 border bg-red-800">{error.message}</div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-2 flex flex-col justify-between gap-2 ${
                  message.role === "user" ? "self-end" : "self-start"
                }`}
              >
                {/* status indicator for latest response */}
                {message.role === "assistant" ? (
                  <div className="text-sm text-zinc-700">
                    status: <span className="text-emerald-700">{status}</span> -
                    id: <span className="text-yellow-700">{message.id}</span>
                  </div>
                ) : null}

                <div>
                  <span className="text-zinc-700">
                    {message.role === "user" ? "Me > " : "AI > "}
                  </span>

                  {/* message part */}
                  {message.role === "user" ? (
                    <span className="text-justify leading-relaxed">
                      {message.content}
                    </span> 
                  ) : (
                    <div>
                    {message.parts?.map((part: any, i: number) => {
                      switch (part.type) {    
                        case 'text':
                          return (
                            <span className="text-justify leading-relaxed">
                              {part.text}
                            </span>
                          );
                        case "tool-invocation":
                          // image part
                          if (part.toolInvocation.state === 'result') {
                            return (
                              <div className="w-full max-w-xl" key={i}>
                                <img
                                src={part.toolInvocation.result.imagePath}
                                alt="Generated Image"
                                className="object-cover"
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div key={i} className="w-full max-w-xl aspect-square flex items-center justify-center bg-zinc-500 animate-pulse animate-duration-100">
                                <h3 className="text-justify leading-relaxed">
                                  Image Generation is processing...
                                </h3>
                              </div>
                            )
                          }
                      }
                    })}
                    </div>
                  )}

                  {message.role === "assistant" && status === "ready" ? (
                    <span className="text-zinc-700 animate-pulse animate-duration-200">
                      {" "}
                      _
                    </span>
                  ) : null}
                </div>

                {/* button set after message is sent */}
                {status === "ready" || status !== "streaming" ? (
                  <div
                    className={`flex justify-center gap-2 ${
                      message.role === "user" ? "self-end" : "self-start"
                    }`}
                  >
                    {/* edit button */}
                    <button
                      title="Edit"
                      type="button"
                      onClick={() => handleEdit(message.id)}
                      disabled={!(status === "ready" || status === "error")}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <Pencil className="size-4" />
                    </button>

                    {/* regenerate button */}
                    <button
                      title="Regenerate"
                      type="button"
                      onClick={() => reload()}
                      disabled={!(status === "ready" || status === "error")}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <RotateCcw className="size-4" />
                    </button>

                    {/* delete button */}
                    <button
                      title="Delete"
                      type="button"
                      onClick={() => handleDelete(message.id)}
                      disabled={!(status === "ready")}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex items-center justify-center gap-2 w-full p-2 border"
      >
        <input
          title="prompt"
          name="prompt"
          placeholder="Ask me anything"
          value={input}
          onChange={handleInputChange}
          className="p-2 border w-full"
        />
        <div className="flex items-center justify-center gap-2">
          {/* submit button */}
          <button
            title="Submit"
            type="submit"
            className="text-white p-2 border cursor-pointer hover:bg-zinc-700"
          >
            Submit
          </button>
          {/* stop button */}
          {status === "streaming" || status === "submitted" ? (
            <button
              title="Stop"
              type="reset"
              className="text-white p-2 border cursor-pointer hover:bg-zinc-700"
              onClick={stop}
              disabled={!(status === "streaming" || status === "submitted")}
            >
              Stop
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
