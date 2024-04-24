import React from 'react';
export function ArrowRightLeft(props) {
  //  stroke={props.stroke || "white"}
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width || '1.2em'}
      height={props.height || '1.2em'}
      viewBox="0 0 24 24"
    >
      <path
        fill="none"
        stroke="black"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.35"
        d="M21 7H3m15 3l3-3l-3-3M6 20l-3-3l3-3m-3 3h18"
      />
    </svg>
  );
}

<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"></svg>;
