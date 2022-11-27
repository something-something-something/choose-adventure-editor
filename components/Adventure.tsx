import { useEffect, useState, } from 'react';
import { AdventureGraphState, } from './lib/AdventureGraph';

export default function Adventure( { adventureGraph, startPageUUID, }:{adventureGraph:AdventureGraphState, startPageUUID:string} ) {
	const [ currentPage, setCurrentPage, ] = useState( startPageUUID );

	useEffect( () => {
		setCurrentPage( startPageUUID );
	}, [ startPageUUID, ] );

	const page = adventureGraph.pages.find( ( p ) => {
		return p.uuid === currentPage;
	} );
	const restartButton = <button onClick={() => { setCurrentPage( startPageUUID ); }}>Restart Adventure</button>;

	if ( page !== undefined ) {
		const buttons = page.buttons.map( ( b ) => {
			return <button key={b.uuid} onClick={() => {
				setCurrentPage( b.pageUUID );
			}}
			>{b.text}</button>;
		} );

		return <div>
			{restartButton}
			<h1>{page.title}
			</h1>
			<div style={{ whiteSpace: 'pre-wrap', }}>{page.text}</div>
			<div>{buttons}</div>
		</div>;
	}
	else {
		return <div>Not found {restartButton}</div>;
	}
}
