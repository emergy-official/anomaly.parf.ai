export default function ButtonChooseDataset({ ...props }) {
  return (
    <button
      style={{ background: props.color }}
      onClick={() => props.setDataset(props.dataset_name)}
      className={`capitalize rounded-full ${props.dataset_name === props.dataset ? 'underline' : ''}  hover:bg-[${props.color}] hover:dark:bg-[${props.color}}] border-none text-white font-bold py-4 px-10 mx-5 md:mt-0 text-lg hover:underline dark:hover:underline `}
    >
      {props.dataset_name.replace('_', ' ')}
    </button>
  );
}
