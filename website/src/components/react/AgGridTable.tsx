import { AgGridReact } from 'ag-grid-react';
import { useEffect, useState } from 'react';
import { getDatasetTableData } from '~/utils/stats/stats';
import { useStore } from '@nanostores/react';
import { model, dataset } from '~/stores/stores';

const ImageRenderer = (props) => {
  if (!props.value.result) {
    return (
      <div className="flex">
        <img alt="origin image" className="mx-auto w-[100px] lg:w-[250px] rounded-lg" src={props.value.origin} />
      </div>
    );
  } else {
    return (
      <div className="flex">
        <img
          alt="origin image"
          className="w-[100px] lg:w-[250px] rounded-tl-lg rounded-bl-lg"
          src={props.value.origin}
        />
        <img
          alt="result image"
          className="w-[100px] lg:w-[250px] rounded-tr-lg rounded-br-lg"
          src={props.value.result}
        />
      </div>
    );
  }
};

const TextRenderer = (props) => {
  return (
    <div className="h-full text-center flex items-center font-size text-[1.3em]">
      <span>{props.value}</span>
    </div>
  );
};
export default function AgGridTable({ ...props }) {
  const $dataset = useStore(dataset);
  const $model = useStore(model);

  const [rowData, setRowData] = useState([]);

  const [colDefs, setColDefs]: any = useState([
    // { field: 'ct', cellRenderer: BoldRenderer, width: 240 },
  ]);

  useEffect(() => {
    const datasetTableData = getDatasetTableData($dataset, $model); // baseline, baseline-ei, efficientad, fomoad
    // const datasetTableData = getDatasetTableData($dataset, $model); // baseline, baseline-ei, efficientad, fomoad
    setRowData(datasetTableData);

    let imageRowSize = window.innerWidth > 768 ? 540 : 230;
    imageRowSize = $model == 'efficientad' ? imageRowSize : imageRowSize / 1.8;
    console.log($model);
    setColDefs([
      {
        field: 'Image',
        cellRenderer: ImageRenderer,
        headerClass: 'text-[1.3em]',
        width: imageRowSize,
      },
      { field: 'Ground Truth', cellRenderer: TextRenderer, headerClass: 'text-[1.3em]' },
      { field: 'Difficulty', cellRenderer: TextRenderer, headerClass: 'text-[1.3em]' },
      { field: 'Prediction', cellRenderer: TextRenderer, headerClass: 'text-[1.3em]' },
      { field: 'Score', cellRenderer: TextRenderer, headerClass: 'text-[1.3em]' },
      { field: 'Time (ms)', cellRenderer: TextRenderer, headerClass: 'text-[1.3em]' },
    ]);
  }, [$dataset, $model]);

  return (
    <AgGridReact
      ensureDomOrder={true}
      suppressMovableColumns={true}
      pagination={true}
      rowData={rowData}
      columnDefs={colDefs}
      paginationPageSizeSelector={[10, 20, 50, 100]}
      rowHeight={window.innerWidth > 768 ? 253 : 100}
      paginationPageSize={10}
      getRowStyle={(params) => ({ border: 'none' })}
    />
  );
}
