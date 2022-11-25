'use client';

import { useEffect, useState, } from 'react';

export default function ClientSideOnly( props ) {
	const [ isServer, setIsServer, ] = useState( true );

	useEffect( () => {
		setIsServer( false );
	}, [] );

	if ( isServer ) {
		return <></>;
	}
	else {
		return <>{props.children}</>;
	}
}
