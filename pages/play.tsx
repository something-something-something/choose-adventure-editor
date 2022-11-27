import { useReducer, } from 'react';
import Adventure from '../components/Adventure';
import { adventureGraphReducer, } from '../components/lib/AdventureGraph';

export default function PlayPage() {
	const [ adventureGraph, dispatchAdventureGraph, ] = useReducer( adventureGraphReducer, { pages: [], }, );

	return ( <>
		{adventureGraph.pages.length === 0
			? (
				<div> please load a file:
					<input type="file" accept="application/json" onChange={( ev ) => {
						if ( ev?.currentTarget?.files?.length === 1 ) {
						//todo check if valid etcS
							const file = ev.currentTarget.files[0];

							( async () => {
								dispatchAdventureGraph( {
									command: 'LoadState',
									state: JSON.parse( await file.text() ),
								} );
							} )();
						}
					}}/>
				</div>
			)
			: ( <Adventure adventureGraph={adventureGraph} startPageUUID={adventureGraph.pages[0].uuid}/> )
		}
	</> );
}
