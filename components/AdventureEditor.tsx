'use client';

import React, { Dispatch, useContext, useReducer, useState, } from 'react';
import Link from 'next/link';
import ClientSideOnly from './ClientSideOnly';
import { AdventureGraphCommand, adventureGraphReducer, adventureGraphReducerInit, AdventureGraphState, AdventurePage, } from './lib/AdventureGraph';
import Adventure from './Adventure';

type AdventureEditorDragItem=AdventureEditorDragItemPage

interface AdventureEditorDragItemBase{
	contains:string
}

interface AdventureEditorDragItemPage extends AdventureEditorDragItemBase{
	contains:'Page',
	data:AdventurePage
}

function pageDragData( page:AdventurePage ):AdventureEditorDragItemPage {
	return {
		contains: 'Page',
		data: page,
	};
}

const AdventureGraphDispatcher = React.createContext( ( command:AdventureGraphCommand ) => { } );
const defaultAdventureGraphStateContext:AdventureGraphState = { pages: [], };
const AdventureGraphStateContext = React.createContext( defaultAdventureGraphStateContext );

const AdventureGraphEditorIsDragingPage = React.createContext( false );

const AdventureGraphEditorSetIsDragingPage = React.createContext( ( b:boolean ) => {} );

const AdventureGraphEditorSetCurrentEditPageUUID = React.createContext( ( s:string ) => {} );

export default function AdventureEditor() {
	const [ adventureGraph, dispatchAdventureGraph, ] = useReducer( adventureGraphReducer, { pages: [], }, adventureGraphReducerInit );

	const [ isDragingPage, setIsDragingPage, ] = useState( false );

	const selectPageList = adventureGraph.pages.map( ( p ) => {
		return <PageItem key={p.uuid} page={p}/>;
	} );

	const [ currentEditPageUUID, setCurrentEditPageUUID, ] = useState( '' );

	const currentEditPage = adventureGraph.pages.find( ( p ) => { return p.uuid === currentEditPageUUID; } );

	return <ClientSideOnly>
		<AdventureGraphDispatcher.Provider value={dispatchAdventureGraph}>

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
			<br/>
			<AdventureGraphEditorSetIsDragingPage.Provider value={setIsDragingPage}>
				<AdventureGraphEditorSetCurrentEditPageUUID.Provider value={setCurrentEditPageUUID}>
					<AdventureGraphEditorIsDragingPage.Provider value={isDragingPage}>
						<AdventureGraphStateContext.Provider value={adventureGraph}>
							{
								currentEditPage !== undefined && <>
									<PageEditor page={currentEditPage}/>
									<PageButtonsEditor page={currentEditPage}/>
								</>

							}
						</AdventureGraphStateContext.Provider>
						<button onClick={() => {
							dispatchAdventureGraph( { command: 'AddPage', } );
						}}>New Page</button>
						<div>
							{selectPageList}
						</div>

						<a
							href={ `data:application/json;base64,${btoa( JSON.stringify( adventureGraph, null, '\t' ) )}`}
							download={ adventureGraph.pages?.[0]?.title + '.json'}
						>
							Download Adventure
						</a>
						<Adventure adventureGraph={adventureGraph} startPageUUID={currentEditPageUUID}/>
					</AdventureGraphEditorIsDragingPage.Provider>
				</AdventureGraphEditorSetCurrentEditPageUUID.Provider>
			</AdventureGraphEditorSetIsDragingPage.Provider>
		</AdventureGraphDispatcher.Provider>
	</ClientSideOnly>;
}

function PageEditor( { page, }:{page:AdventurePage} ) {
	const dispatchAdventureGraph = useContext( AdventureGraphDispatcher );

	return <form onSubmit={( ev ) => {
		ev.preventDefault();
	}}>
		<label>Title
			<input type="text" value={page.title} onChange={( ev ) => {
				dispatchAdventureGraph( {
					command: 'UpdatePageTitle',
					pageUUID: page.uuid,
					title: ev.target.value,
				} );
			}}/>
		</label>
		<br/>
		<label>Text<br/>
			<textarea value={page.text} onChange={( ev ) => {
				dispatchAdventureGraph( {
					command: 'UpdatePageText',
					pageUUID: page.uuid,
					text: ev.target.value,
				} );
			}}/>
		</label>
	</form>;
}

function PageButtonsEditor( { page, }:{page:AdventurePage} ) {
	const dispatchAdventureGraph = useContext( AdventureGraphDispatcher );
	const adventureGraph = useContext( AdventureGraphStateContext );

	return <div>
		Buttons:
		{
			page.buttons.map( ( b ) => {
				return <form key={b.uuid} onSubmit={( ev ) => {
					ev.preventDefault();
				}}>
					<label>Title
						<input value={b.text} onChange={( ev ) => {
							dispatchAdventureGraph( {
								command: 'SetButtonText',
								pageUUID: page.uuid,
								buttonUUID: b.uuid,
								text: ev.target.value,
							} );
						}}/>
					</label>
					<label>Page: {adventureGraph.pages.find( ( p ) => { return p.uuid === b.pageUUID; } )?.title}</label>
					<button type="button" onClick={() => {
						dispatchAdventureGraph( {
							command: 'DeleteButton',
							pageUUID: page.uuid,
							buttonUUID: b.uuid,

						} );
					}}>Delete</button>
				</form>;
			} )

		}
		<div onDrop={( ev ) => {
			ev.preventDefault();

			try {
				const data:AdventureEditorDragItem = JSON.parse( ev.dataTransfer.getData( 'application/json' ) );

				if ( data.contains === 'Page' ) {
					dispatchAdventureGraph( {
						command: 'AddButton',
						parentPageUUID: page.uuid,
						navigateToPageUUID: data.data.uuid,
						text: data.data.title,
					} );
				}
			}
			catch ( err ) {
				console.log( 'data drop failed', err );
			}
		}}
		onDragOver={( ev ) => {
			ev.preventDefault();
		}}>
			drag page to add button
		</div>
	</div>;
}

function PageItem( props:{ page: AdventurePage, } ) {
	const dispatchAdventureGraph = useContext( AdventureGraphDispatcher );

	const setIsDragingPage = useContext( AdventureGraphEditorSetIsDragingPage );
	const isDragingPage = useContext( AdventureGraphEditorIsDragingPage );

	const setCurrentEditPageUUID = useContext( AdventureGraphEditorSetCurrentEditPageUUID );

	const [ canDropHere, setCanDropHere, ] = useState( false );

	return <>{isDragingPage && <div onDrop={( ev ) => {
		ev.preventDefault();

		try {
			const data:AdventureEditorDragItem = JSON.parse( ev.dataTransfer.getData( 'application/json' ) );

			if ( data.contains === 'Page' ) {
				dispatchAdventureGraph( {
					command: 'MovePageAbovePage',
					pageToBeBelowUUID: props.page.uuid,
					pageToMoveUUID: data.data.uuid,
				} );
			}
		}
		catch ( err ) {
			console.log( 'data drop failed', err );
		}
	}}
	onDragOver={( ev ) => {
		ev.preventDefault();
	}}

	onDragEnter={() => {
		setCanDropHere( true );
	}}
	onDragLeave={() => {
		setCanDropHere( false );
	}}
	>
		{canDropHere ? 'drop here' : 'drag here'}
	</div>}
	<div draggable
		onClick={( ev ) => {
			setCurrentEditPageUUID( props.page.uuid );
		}}
		onDragStart={ ( ev ) => {
			setIsDragingPage( true );
			ev.dataTransfer.setData( 'application/json', JSON.stringify( pageDragData( props.page ) ) );
			ev.dataTransfer.setData( 'text/plain', JSON.stringify( pageDragData( props.page ) ) );
			console.log( ev.currentTarget.clientWidth, ev.currentTarget.clientHeight );
			ev.dataTransfer.setDragImage( ev.currentTarget, 0, ev.currentTarget.clientHeight );
		}}
		onDragEnd={() => {
			setIsDragingPage( false );
		}}
	>
		{props.page.title}
		<button onClick={() => {
			if ( confirm( 'Are you sure you want to delete' + props.page.title ) ) {
				dispatchAdventureGraph( {
					command: 'DeletePage',
					pageUUID: props.page.uuid,
				} );
			}
		}}>Delete</button>
	</div>

	</>;
}
