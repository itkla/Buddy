'use client';

import { useChat } from '@ai-sdk/react';

export default function Page() {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();

  return (
    <div className='flex flex-col items-center justify-center gap-2 h-full min-h-screen w-full max-w-4xl mx-auto p-2'>
      <div className='flex flex-col justify-center border w-full p-2 text-justify'>
        {messages.map(message => (
          <div
            key={message.id}
            className={`p-2 ${message.role === 'user' ? 'self-end' : 'self-start'}`}
          >
            <span className='text-zinc-700'>
              {message.role === 'user' ? 'Me > ' : 'AI > '}
            </span>
            <span className='text-justify leading-relaxed'>
              {message.content}
            </span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className='flex items-center justify-center gap-2 w-full p-2 border'>
        <input
          title='prompt'
          name="prompt"
          value={input}
          onChange={handleInputChange}
          className='p-2 border w-full'
        />
        <button type="submit" className='text-white p-2 border cursor-pointer hover:bg-zinc-700'>Submit</button>
      </form>
    </div>
  );
}