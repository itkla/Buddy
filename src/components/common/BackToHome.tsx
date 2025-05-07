import Link from 'next/link';

export default function BackToHome() {
  return <Link href="/" className='fixed top-4 right-4 p-2 border cursor-pointer hover:bg-zinc-700'>Home</Link>;
}
