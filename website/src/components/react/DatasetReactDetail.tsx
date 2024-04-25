import { useEffect, useState } from 'react';
import PieReChart from '../recharts/PieReChart';
import { getBenchmarkF1Score, getBenchmarkF1ScorePerDifficulty, getDatasetDistribution, getDatasetSizeChart } from '~/utils/stats/stats';
import SimpleBarReChart from '../recharts/SimpleBarReChart';
import { AgGridReact } from 'ag-grid-react';
import benchmark from '~/utils/stats/benchmarks.json';
import { ComposedChart } from 'recharts';
import ComposedReChart from '../recharts/ComposedReChart';
import SimpleRadialBarReChart from '../recharts/SimpleRadialBarReChart';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 100, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 100, amt: 2400 },
];

const BoldRenderer = (props) => {
  return <div>{props.value}</div>;
};
export default function DatasetReactDetail() {
  const datasetSizeData = getDatasetSizeChart();
  const datasetDistributionData = getDatasetDistribution();
  const benchmarkF1Score = getBenchmarkF1Score('cookies_1');
  const benchmarkF1ScoreBaseline = getBenchmarkF1ScorePerDifficulty('cookies_1', 'FOMOAD');

  const [rowData, setRowData] = useState([{ make: 'Tesla', model: 'Model Y', price: 64950, electric: true }]);

  console.log("benchmarkF1ScoreBaseline", benchmarkF1ScoreBaseline)

  // Column Definitions: Defines the columns to be displayed.
  const [theme, setTheme]: any = useState('');
  const [colDefs, setColDefs]: any = useState([
    { field: 'Baseline', width: 90 },
    { field: 'Baseline Converted Edge Impulse', cellRenderer: BoldRenderer, width: 240 },
    { field: 'Efficient AD', width: 120 },
    { field: 'FOMO AD', width: 120 },
  ]);
  useEffect(() => {}, []);

  return (
    <>
      <div className="text-center md:gap-16 py-12 md:py-10">
        <h3 className="text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
          <span className="text-accent dark:text-white highlight">Dataset</span> Explorer
        </h3>
      </div>
      <div className="flex md:gap-16 max-w-7xl mx-auto py-12 md:py-10">
        <PieReChart data={datasetSizeData} />
        <SimpleBarReChart data={datasetDistributionData} />
      </div>
      <div className="flex md:gap-16 max-w-7xl mx-auto py-12 md:py-10">
        <ComposedReChart data={benchmarkF1Score} />
      </div>
      <div className="flex md:gap-16 max-w-7xl mx-auto py-12 md:py-10">
        <SimpleRadialBarReChart data={benchmarkF1ScoreBaseline} />
      </div>
      <div className="md:gap-16 py-12 p-4 md:py-10 max-w-2xl">
        <div
          className={theme == 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} // applying the grid theme
          style={{ width: '100%', height: '100%' }}
        >
          <AgGridReact
            rowData={rowData}
            columnDefs={colDefs}
            rowHeight={49}
            getRowStyle={(params) => ({ border: 'none' })}
          />
        </div>
      </div>
    </>
  );
}
