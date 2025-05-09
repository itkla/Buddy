'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { notificationSchema } from '@/app/api/notifications/scehma';
import SectionTitle from '@/components/layout/SectionTitle';

const title = "Use Object";
const description = "The useObject hook allows you to generate an object using the AI SDK. This hook is useful when you want to generate an object using the AI SDK.";

export default function Page() {
  // Loading State
  // The isLoading state returned by the useObject hook can be used for several purposes.
  // Stop Handler
  // The stop function can be used to stop the object generation process. This can be useful if the user wants to cancel the request or if the server is taking too long to respond.
  // Error State
  // The error state reflects the error object thrown during the fetch request. It can be used to display an error message, or to disable the submit button:
  // Event Callbacks
  // useObject provides optional event callbacks that you can use to handle life-cycle events.
  // onFinish: Called when the object generation is completed.
  // onError: Called when an error occurs during the fetch request.
  // Configure Request Options
  // You can configure the API endpoint, optional headers and credentials using the api, headers and credentials settings.
  const { isLoading, error, object, submit, stop } = useObject({
    api: '/api/notifications',
    schema: notificationSchema,
    // Custom Headers
    headers: {
      'X-Custom-Header': 'CustomValue',
    },
    credentials: 'include',
    // Event Callbacks
    onFinish({ object, error }) {
      // typed object, undefined if schema validation fails:
      console.log('Object generation completed:', object);

      // error, undefined if schema validation succeeds:
      console.log('Schema validation error:', error);
    },
    onError(error) {
      // error during fetch request:
      console.error('An error occurred:', error);
    },
  });


  return (
    <div className='flex flex-col items-center justify-center gap-2 h-full min-h-screen w-full max-w-4xl mx-auto p-2'>
      <SectionTitle title={title} description={description} />
      
      {/*  show a loading spinner while loading. */}
      {isLoading && <div className='p-2 border animate-pulse bg-zinc-700'>Loading...</div>}
      {error && <div className='p-2 border animate-pulse bg-red-300'>An error occurred.</div>}

      <div className='flex flex-col gap-2 w-full p-2 border'>
        {(!object) ? (
          <div className='p-2 border'>
            <p className='text-zinc-500'>Notifications</p>
          </div>
        ) : (
          object?.notifications?.map((notification: any, index: number) => (
            <div key={index} className='w-full p-2 border'>
              <p>{notification?.name}</p>
              <p>{notification?.message}</p>
            </div>
          ))
        )}
      </div>

      <div className='flex gap-2'>
        <button
          onClick={() => submit('Messages during finals week.')}
          disabled={isLoading} // Disable the button while loading.
          className='p-2 border cursor-pointer hover:bg-zinc-700'
        >
          Generate
        </button>

        {isLoading && (
          <button
            type="button"
            onClick={() => stop()}
            className='p-2 border cursor-pointer hover:bg-zinc-700'
          >
            Stop
          </button>
        )}
      </div>
    </div>
  );
}