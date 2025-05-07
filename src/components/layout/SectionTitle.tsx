export default function SectionTitle({ title, description }: { title: string, description: string }) {
  return (
    <div className='flex flex-col gap-2 w-full mb-4'>
        <h1 className='text-2xl font-bold'>{title}</h1>
        <p className='text-sm text-zinc-500 text-justify'>
          {description}
        </p>
    </div>
  );
}
