'use client';

import { useChat, Message, } from '@ai-sdk/react';
import { LanguageModelUsage } from 'ai';
import { useState } from 'react';
import SectionTitle from '@/components/layout/SectionTitle';
import { Trash2, Pencil, RotateCcw } from 'lucide-react';

const title = "Token Usage";
const description = "This is a simple token usage tracker for the OpenAI API. It shows the number of tokens used for each message in the chat.";

export default function Page() {
  const [usage, setUsage] = useState<LanguageModelUsage | null>(null);
  const { messages, setMessages, status, input, stop, reload, handleInputChange, handleSubmit, error } = useChat({
    api: '/api/tokenUsage',
    onFinish: (message: Message, options: {
      usage: LanguageModelUsage;
      finishReason: string;
    }) => {
      setUsage(options.usage);
    },
  });

  const handleEdit = (id: string) => {
    setMessages(messages.map(message => message.id === id ? { ...message, content: input } : message));
    reload();
  }

  const handleDelete = (id: string) => {
    setMessages(messages.filter(message => message.id !== id))
  }

  return (
    <div className='flex flex-col items-center justify-center gap-2 h-full min-h-screen w-full max-w-4xl mx-auto p-2'>
      <SectionTitle title={title} description={description} />
      <div className='flex flex-col justify-center border w-full p-2 text-justify'>
        {messages.length === 0 ? (
          <div className='p-2 border'>
            <p className='text-zinc-500'>Chat Area</p>
          </div>
        ) : (
          <>
            {error ? <div className='p-2 border bg-red-800'>{error.message}</div> : null}

            {messages.map(message => (
              <div
                key={message.id}
                className={`p-2 flex flex-col justify-between gap-2 ${message.role === 'user' ? 'self-end' : 'self-start'}`}
              >
                {/* status indicator for latest response */}
                {message.role === 'assistant' ? (
                  <div className='text-sm text-zinc-700'>status: <span className='text-emerald-700'>{status}</span> - id: <span className='text-yellow-700'>{message.id}</span></div>
                ) : null}

                <div>
                  <span className='text-zinc-700'>
                    {message.role === 'user' ? 'Me > ' : 'AI > '}
                  </span>

                  <span className='text-justify leading-relaxed'>
                    {message.content}
                  </span>

                  {message.role === 'assistant' && status === 'ready' ? (
                    <span className='text-zinc-700 animate-pulse animate-duration-200'> _</span>
                  ) : null}
                </div>

                {/* button set after message is sent */}
                {status === 'ready' || status !== 'streaming' ? (
                  <div className={`flex justify-center gap-2 ${message.role === 'user' ? 'self-end' : 'self-start'}`}>
                    {/* edit button */}
                    <button
                      title='Edit'
                      type='button'
                      onClick={() => handleEdit(message.id)}
                      disabled={!(status === 'ready' || status === 'error')}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <Pencil className='size-4' />
                    </button>

                    {/* regenerate button */}
                    <button
                      title='Regenerate'
                      type='button'
                      onClick={() => reload()}
                      disabled={!(status === 'ready' || status === 'error')}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <RotateCcw className='size-4' />
                    </button>

                    {/* delete button */}
                    <button
                      title='Delete'
                      type='button'
                      onClick={() => handleDelete(message.id)}
                      disabled={!(status === 'ready')}
                      className="block aspect-square w-fit cursor-pointer brightness-50 hover:brightness-100 hover:bg-zinc-700 p-1 rounded-md"
                    >
                      <Trash2 className='size-4' />
                    </button>

                  </div>
                ) : null}
                
              </div>
            ))}
            {/* usage of the message */}
              <div className='flex flex-col gap-1 p-2 text-zinc-500 text-sm border'>
                <h1>Token Usage</h1>
                <span>{`{`}</span>
                  <div className='flex items-center'>
                    <span>&emsp;type:&nbsp;</span>
                    <span className='text-purple-400/80'>promptTokens</span>
                    &nbsp;-&nbsp;
                    <span className='text-amber-500'>usage:&nbsp;</span>
                    <span className='text-pink-400/90'>{usage?.promptTokens}</span>
                  </div>
                  <div className='flex items-center'>
                    <span>&emsp;type:&nbsp;</span>
                    <span className='text-purple-400/80'>completionTokens</span>
                    &nbsp;-&nbsp;
                    <span className='text-amber-500'>usage:&nbsp;</span>
                    <span className='text-pink-400/90'>{usage?.completionTokens}</span>
                  </div>
                  <div className='flex items-center'>
                    <span>&emsp;type:&nbsp;</span>
                    <span className='text-purple-400/80'>totalTokens</span>
                    &nbsp;-&nbsp;
                    <span className='text-amber-500'>usage:&nbsp;</span>
                    <span className='text-pink-400/90'>{usage?.totalTokens}</span>
                  </div>
                <span>{`}`}</span>
            </div>
          </>
        )}
      </div>
      <form onSubmit={handleSubmit} className='flex items-center justify-center gap-2 w-full p-2 border' >
        <input
          title='prompt'
          name="prompt"
          placeholder='Ask me anything'
          value={input}
          onChange={handleInputChange}
          className='p-2 border w-full'
        />
        <div className='flex items-center justify-center gap-2'>
          {/* submit button */}
          <button title='Submit' type="submit" className='text-white p-2 border cursor-pointer hover:bg-zinc-700'>Submit</button>
          {/* stop button */}
          {status === 'streaming' || status === 'submitted' ? (
            <button title='Stop' type="reset" className='text-white p-2 border cursor-pointer hover:bg-zinc-700' onClick={stop} disabled={!(status === 'streaming' || status === 'submitted')}>Stop</button>
          ) : null}
        </div>
      </form>
    </div>
  );
}