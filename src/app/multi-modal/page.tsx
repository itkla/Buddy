'use client';

import { useChat } from '@ai-sdk/react';
import { useRef, useState } from 'react';
import Image from 'next/image';
import SectionTitle from '@/components/layout/SectionTitle';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/multiModal",
    onFinish: () => {
      // メッセージが完了したら、画面の最下部にスクロール
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    }
  });

  // file upload
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-4xl h-full min-h-screen py-24 mx-auto stretch">
      <SectionTitle title="Multi Modal" description="A multi-modal AI-chatbot capable of understanding images and pdfs." />
      <div className='w-full flex flex-col gap-2 p-2 border'>
        {messages.length === 0 ? (
          <div className='text-center text-zinc-500'>
            <p>Please upload a file or input text.</p>
          </div>
        ) : (
          messages.map(m => (
            <div key={m.id} className="whitespace-pre-wrap">
            {m.role === 'user' ? 'User: ' : 'AI: '}
            {m.content}
            
              {/* uploaded files part */}
              <div>
                {m?.experimental_attachments?.some(attachment => 
                  attachment?.contentType?.startsWith('image/')
                ) ? (
                  <div className="flex flex-col gap-2">
                    {m.experimental_attachments?.map((attachment, index) => (
                      <Image
                        key={`${m.id}-${index}`}
                        src={attachment.url}
                        width={500}
                        height={500}
                        alt={attachment.name ?? `attachment-${index}`}
                      />
                    ))}
                  </div>
                ) : (
                  <p className='text-zinc-700'>{m.experimental_attachments?.map(attachment => attachment.name).join(', ')}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* user input part */}
      <form
        className="w-full p-2 mb-8 border border-gray-300 rounded shadow-xl space-y-2"
        onSubmit={event => {
          handleSubmit(event, {
            experimental_attachments: files,
          });

          setFiles(undefined);

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
      >
        {/* text input part */}
        <div className='flex items-center justify-center gap-2'>
          <input
            title="Input"
            className="w-full p-2 border"
            value={input}
            placeholder="Say something..."
            onChange={handleInputChange}
          />
          {/* submit button */}
          <button
            title='Submit'
            type="submit"
            className='text-white p-2 border cursor-pointer hover:bg-zinc-700'
          >
            Submit
          </button>
        </div>
        {/* file upload part */}
        <input
          title="Upload file"
          type="file"
          className="p-2 cursor-pointer border hover:bg-zinc-700"
          onChange={event => {
            if (event.target.files) {
              setFiles(event.target.files);
            }
          }}
          multiple
          ref={fileInputRef}
        />
      </form>
    </div>
  );
}