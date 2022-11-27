export interface AdventureGraphState{
	pages:AdventurePage[]
};

export interface AdventurePage{
	uuid:string
	title:string
	text:string
	buttons:AdventurePageButton[]
}

export interface AdventurePageButton{
		uuid:string
		text:string
		pageUUID:string
}
export type AdventureGraphCommand =AdventureGraphCommandAddPage |
AdventureGraphCommandLoadState|
 AdventureGraphCommandDeletePage|
 AdventureGraphCommandMovePageAbovePage|
 AdventureGraphCommandUpdatePageTitle |
 AdventureGraphCommandUpdatePageText|
 AdventureGraphCommandAddButton |
 AdventureGraphCommandSetButtonText|AdventureGraphCommandDeleteButton;

interface AdventureGraphCommandBase{
	command:string
}

interface AdventureGraphCommandLoadState extends AdventureGraphCommandBase{
	command:'LoadState'
	state:AdventureGraphState
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

interface AdventureGraphCommandDeleteButton extends AdventureGraphCommandBase{
	command:'DeleteButton'
	pageUUID:string
	buttonUUID:string

}

interface AdventureGraphCommandSetButtonText extends AdventureGraphCommandBase{
	command:'SetButtonText'
	pageUUID:string
	buttonUUID:string
	text:string
}

export function adventureGraphReducer( currentSate:AdventureGraphState, command :AdventureGraphCommand ) {
	if ( command.command === 'AddPage' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerAddPage( currentSate.pages, command ),
		};
	}
	else if ( command.command === 'LoadState' ) {
		return structuredClone( command.state );
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
	else if ( command.command === 'DeleteButton' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerDeleteButton( currentSate.pages, command ),
		};
	}
	else if ( command.command === 'SetButtonText' ) {
		return {
			...currentSate,
			pages: adventureGraphReducerSetButtonText( currentSate.pages, command ),
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
//

function adventureGraphReducerDeleteButton( currentPages:AdventurePage[], command :AdventureGraphCommandDeleteButton ):AdventurePage[] {
	return currentPages.map( ( p ) => {
		if ( p.uuid === command.pageUUID ) {
			return {
				...p,
				buttons: p.buttons.filter( ( b ) => { return b.uuid !== command.buttonUUID; } ),
			};
		}
		else {
			return p;
		}
	} );
}

function adventureGraphReducerSetButtonText( currentPages:AdventurePage[], command :AdventureGraphCommandSetButtonText ):AdventurePage[] {
	return currentPages.map( ( p ) => {
		if ( p.uuid === command.pageUUID ) {
			return {
				...p,
				buttons: p.buttons.map( ( b ) => {
					if ( b.uuid === command.buttonUUID ) {
						return {
							...b,
							text: command.text,
						};
					}

					return b;
				} ),
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

export function adventureGraphReducerInit() {
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
