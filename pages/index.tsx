import Link from 'next/link';

export default function HomePage() {
	return <>
		<Link href="/play">Play an Adventure</Link> <br/>
		<Link href="/editor">Go to editor</Link>
	</>;
}
