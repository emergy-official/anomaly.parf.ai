export function Loader2(props) {
  //  stroke={props.stroke || "white"}
  return (
    <svg
      className={'animate-spin'}
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
        d="M12 3a9 9 0 1 0 9 9"
      />
    </svg>
  );
}

<svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"></svg>;
