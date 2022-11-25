'use client';

import React, { Dispatch, useContext, useReducer, useState, } from 'react';
import Link from 'next/link';
import ClientSideOnly from './ClientSideOnly';

interface AdventureGraphState{
	pages:AdventurePage[]
};

interface AdventurePage{
	uuid:string
	title:string
	text:string
	buttons:{
		text:string
	}[]
}
type AdventureGraphCommand =AdventureGraphCommandAddPage | AdventureGraphCommandDeletePage|AdventureGraphCommandMovePageAbovePage;

interface AdventureGraphCommandBase{
	command:string
}

interface AdventureGraphCommandAddPage extends AdventureGraphCommandBase{
	command:'AddPage'
}

interface AdventureGraphCommandDeletePage extends AdventureGraphCommandBase{
	command:'DeletePage'
	pageUUID:string
}

interface AdventureGraphCommandMovePageAbovePage extends AdventureGraphCommandBase{
	command:'MovePageAbovePage'
	pageToMoveUUID:string
	pageToBeBelowUUID:string
}

function adventureGraphReducer( currentSate:AdventureGraphState, command :AdventureGraphCommand ) {
	if ( command.command === 'AddPage' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerAddPage( currentSate.pages, command ),
		};
	}
	else if ( command.command === 'DeletePage' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerDeletePage( currentSate.pages, command ),
		};
	}
	else if ( command.command === 'MovePageAbovePage' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerMovePageAbovePage( currentSate.pages, command ),
		};
	}

	return currentSate;
}

function adventureGraphReducerAddPage( currentPages:AdventurePage[], command :AdventureGraphCommandAddPage ):AdventurePage[] {
	return [ ...currentPages, makeNewBlankPage(), ];
}

//TODO When buttons are added this should also delete buttons
function adventureGraphReducerDeletePage( currentPages:AdventurePage[], command:AdventureGraphCommandDeletePage ):AdventurePage[] {
	return currentPages.filter( ( p ) => {
		return p.uuid !== command.pageUUID;
	} );
}

function adventureGraphReducerMovePageAbovePage( currentPages:AdventurePage[], command:AdventureGraphCommandMovePageAbovePage ):AdventurePage[] {
	if ( command.pageToBeBelowUUID === command.pageToMoveUUID ) {
		return currentPages;
	}

	const pageToMove = currentPages.find( ( p ) => {
		return p.uuid === command.pageToMoveUUID;
	} );

	if ( pageToMove === undefined ) {
		return currentPages;
	}

	return currentPages.flatMap( ( p ) => {
		if ( p.uuid === command.pageToBeBelowUUID ) {
			return [ pageToMove, p, ];
		}
		else if ( p.uuid === command.pageToMoveUUID ) {
			return [];
		}

		return p;
	} );
}

function makeUUID() {
	return crypto.randomUUID();
}

function adventureGraphReducerInit() {
	return {
		pages: [ makeNewBlankPage(), ],
	};
}

function makeNewBlankPage() :AdventurePage {
	return {
		uuid: makeUUID(),
		title: 'New Page',
		text: '',
		buttons: [],
	};
}

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

const AdventureGraphEditorIsDragingPage = React.createContext( false );

const AdventureGraphEditorSetIsDragingPage = React.createContext( ( b:boolean ) => {} );

export default function AdventureEditor() {
	const [ adventureGraph, dispatchAdventureGraph, ] = useReducer( adventureGraphReducer, { pages: [], }, adventureGraphReducerInit );

	const [ isDragingPage, setIsDragingPage, ] = useState( false );

	const selectPageList = adventureGraph.pages.map( ( p ) => {
		return <PageItem key={p.uuid} page={p}/>;
	} );

	return <ClientSideOnly>
		<AdventureGraphDispatcher.Provider value={dispatchAdventureGraph}>
			<AdventureGraphEditorSetIsDragingPage.Provider value={setIsDragingPage}>
				<AdventureGraphEditorIsDragingPage.Provider value={isDragingPage}>
					<button onClick={() => {
						dispatchAdventureGraph( { command: 'AddPage', } );
					}}>New Page</button>
					<div>
						{selectPageList}
					</div>
				</AdventureGraphEditorIsDragingPage.Provider>
			</AdventureGraphEditorSetIsDragingPage.Provider>
		</AdventureGraphDispatcher.Provider>
	</ClientSideOnly>;
}

function PageItem( props:{ page: AdventurePage, } ) {
	const dispatchAdventureGraphDispatch = useContext( AdventureGraphDispatcher );

	const setIsDragingPage = useContext( AdventureGraphEditorSetIsDragingPage );
	const isDragingPage = useContext( AdventureGraphEditorIsDragingPage );

	const [ canDropHere, setCanDropHere, ] = useState( false );

	return <>{isDragingPage && <div onDrop={( ev ) => {
		ev.preventDefault();

		try {
			const data:AdventureEditorDragItem = JSON.parse( ev.dataTransfer.getData( 'application/json' ) );

			if ( data.contains === 'Page' ) {
				dispatchAdventureGraphDispatch( {
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
		{props.page.title}{props.page.uuid}
		<button onClick={() => {
			dispatchAdventureGraphDispatch( {
				command: 'DeletePage',
				pageUUID: props.page.uuid,
			} );
		}}>Delete</button>
	</div>

	</>;
}
