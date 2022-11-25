'use client';

import React, { useEffect, useState, } from 'react';

export default function ClientSideOnly( props :{children?:React.ReactNode} ) {
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
