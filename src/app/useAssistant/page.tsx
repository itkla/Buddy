'use client';

import { Message, useAssistant } from '@ai-sdk/react';
import SectionTitle from '@/components/layout/SectionTitle';

const title = "OpenAI Assistants";
const description = "The useAssistant hook allows you to handle the client state when interacting with an OpenAI compatible assistant API. This hook is useful when you want to integrate assistant capabilities into your application, with the UI updated automatically as the assistant is streaming its execution.";

export default function Page() {
  const { status, messages, input, submitMessage, handleInputChange, error } = useAssistant({ api: '/api/assistant' });


  return (
    <div className='flex flex-col items-center justify-center gap-2 h-full min-h-screen w-full max-w-4xl mx-auto p-2'>
      <SectionTitle title={title} description={description} />
      
      {status === "in_progress" ? <div className='p-2 border animate-pulse bg-zinc-700'>Loading</div> : null}

      {error ? <div className='p-2 border bg-red-800'>{error.message}</div> : null}

      <div className=''>
        {messages.map((m: Message) => (
          <div key={m.id}>
            <strong>{'${m.role} > '}</strong>
            {m.role !== 'data' && m.content}
            {m.role === 'data' && (
              <>
                {(m.data as any).description}
                <br />
                <pre className='bg-zinc-900 text-zinc-50 p-2'>
                  {JSON.stringify(m.data, null, 2)}
                </pre>
              </>
            )}
            <span>{m.content}</span>
          </div>
        ))}

        {status === 'in_progress' && <div className='p-2 border animate-pulse bg-zinc-700'>Loading...</div>}

        <form onSubmit={submitMessage}>
          <input
            title='prompt'
            name='prompt'
            placeholder='Ask me anything'
            className='w-full p-2 border'
            value={input}
            onChange={handleInputChange}
            disabled={status !== 'awaiting_message'}
          />
        </form>
      </div>
    </div>
  );
}

