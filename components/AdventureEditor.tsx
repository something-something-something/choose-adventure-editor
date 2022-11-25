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
	buttons:AdventurePageButton[]
}

interface AdventurePageButton{
		uuid:string
		text:string
		pageUUID:string
}
type AdventureGraphCommand =AdventureGraphCommandAddPage |
 AdventureGraphCommandDeletePage|
 AdventureGraphCommandMovePageAbovePage|
 AdventureGraphCommandUpdatePageTitle |
 AdventureGraphCommandUpdatePageText|
 AdventureGraphCommandAddButton;

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

interface AdventureGraphCommandUpdatePageTitle extends AdventureGraphCommandBase{
	command:'UpdatePageTitle'
	pageUUID:string
	title:string
}

interface AdventureGraphCommandUpdatePageText extends AdventureGraphCommandBase{
	command:'UpdatePageText'
	pageUUID:string
	text:string
}

interface AdventureGraphCommandAddButton extends AdventureGraphCommandBase{
	command:'AddButton'
	parentPageUUID:string
	navigateToPageUUID:string
	text?:string
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

	else if ( command.command === 'UpdatePageTitle' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerUpdatePageTitle( currentSate.pages, command ),
		};
	}

	else if ( command.command === 'UpdatePageText' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerUpdatePageText( currentSate.pages, command ),
		};
	}

	else if ( command.command === 'AddButton' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerAddButton( currentSate.pages, command ),
		};
	}

	return currentSate;
}

function adventureGraphReducerAddPage( currentPages:AdventurePage[], command :AdventureGraphCommandAddPage ):AdventurePage[] {
	return [ ...currentPages, makeNewBlankPage(), ];
}

function adventureGraphReducerDeletePage( currentPages:AdventurePage[], command:AdventureGraphCommandDeletePage ):AdventurePage[] {
	return currentPages.flatMap( ( p ) => {
		if ( p.uuid === command.pageUUID ) {
			return [];
		}
		else {
			return {
				...p,
				buttons: p.buttons.filter( ( b ) => {
					return b.pageUUID !== command.pageUUID;
				} ),
			};
		}
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

function adventureGraphReducerUpdatePageTitle( currentPages:AdventurePage[], command :AdventureGraphCommandUpdatePageTitle ):AdventurePage[] {
	return currentPages.map( ( p ) => {
		if ( p.uuid === command.pageUUID ) {
			return {
				...p,
				title: command.title,
			};
		}
		else {
			return p;
		}
	} );
}

function adventureGraphReducerUpdatePageText( currentPages:AdventurePage[], command :AdventureGraphCommandUpdatePageText ):AdventurePage[] {
	return currentPages.map( ( p ) => {
		if ( p.uuid === command.pageUUID ) {
			return {
				...p,
				text: command.text,
			};
		}
		else {
			return p;
		}
	} );
}

function adventureGraphReducerAddButton( currentPages:AdventurePage[], command :AdventureGraphCommandAddButton ):AdventurePage[] {
	return currentPages.map( ( p ) => {
		if ( p.uuid === command.parentPageUUID ) {
			return {
				...p,
				buttons: [ ...p.buttons, makeNewButton( command.navigateToPageUUID, command.text ), ],
			};
		}
		else {
			return p;
		}
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

function makeNewButton( pageUUID:string, text?:string ) :AdventurePageButton {
	return {
		uuid: makeUUID(),
		text: text ?? '',
		pageUUID,
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
		<label>Title
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
							// dispatchAdventureGraph( {
							// 	command: 'UpdatePageText',
							// 	pageUUID: page.uuid,
							// 	text: ev.target.value,
							// } );
						}}/>
					</label>
					<label>Page: {adventureGraph.pages.find( ( p ) => { return p.uuid === b.pageUUID; } )?.title}</label>
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
