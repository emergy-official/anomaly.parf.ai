import { useEffect, useState } from 'react';
import PieReChart from '../recharts/PieReChart';
import {
  COLORS,
  getBenchmarkF1Score,
  getBenchmarkF1ScorePerDifficulty,
  getDatasetDistribution,
  getDatasetSizeChart,
  getDatasetTableData,
} from '~/utils/stats/stats';
import SimpleBarReChart from '../recharts/SimpleBarReChart';
import benchmark from '~/utils/stats/benchmarks.json';
import { ComposedChart } from 'recharts';
import ComposedReChart from '../recharts/ComposedReChart';
import SimpleRadialBarReChart from '../recharts/SimpleRadialBarReChart';
import ComparisonSlider from '../ComparaisonSlider/ComparisonSlider';
import ButtonChooseDataset from './ButtonChooseDataset';
import AgGridTable from './AgGridTable';
import { useStore } from '@nanostores/react';
import { model, dataset } from '~/stores/stores';
import ButtonChooseModel from './ButtonChooseModel';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 100, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 100, amt: 2400 },
];

export default function DatasetReactDetail() {
  const $dataset = useStore(dataset);
  const $model = useStore(model);

  // Column Definitions: Defines the columns to be displayed.
  const [theme, setTheme]: any = useState('');

  const datasetSizeData = getDatasetSizeChart();
  const datasetDistributionData = getDatasetDistribution();
  const benchmarkF1Score = getBenchmarkF1Score($dataset);
  const benchmarkF1ScoreBaseline = getBenchmarkF1ScorePerDifficulty($dataset, $model);

  useEffect(() => {
    setTheme(localStorage.theme);
    // setRowData(datasetTableData)
  }, []);

  return (
    <>
      <div className="text-center md:gap-16 pt-12 md:py-10">
        <h3 className="text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
          <span className="text-[#2a9d8f]">Dataset</span> Explorer
        </h3>
      </div>
      <div className="md:gap-16 max-w-7xl mx-auto md:py-10 md:flex">
        <div className="mt-3 md:mt-0 md:w-1/2 h-[250px]">
          <h4 className="text-center font-bold">Images per dataset</h4>
          <PieReChart data={datasetSizeData} />
        </div>
        <div className="mt-20 md:mt-0 md:w-1/2 h-[250px]">
          <h4 className="text-center font-bold">Number of images per category per dataset</h4>
          <SimpleBarReChart data={datasetDistributionData} />
        </div>
      </div>
      <div className="md:gap-16 max-w-7xl mx-auto py-12 md:py-10">
        <div className="flex justify-center mb-8">
          <h4 className="text-2xl font-bold">Choose a dataset to explore</h4>
        </div>
        <div className="flex mt-3 md:mt-0 flex justify-center flex-col md:flex-row">
          <ButtonChooseDataset setDataset={dataset.set} dataset={$dataset} dataset_name="cookies_1" color={COLORS[0]} />
          <ButtonChooseDataset setDataset={dataset.set} dataset={$dataset} dataset_name="cookies_2" color={COLORS[1]} />
          <ButtonChooseDataset setDataset={dataset.set} dataset={$dataset} dataset_name="cookies_3" color={COLORS[2]} />
        </div>
      </div>
      <div className="md:gap-16 max-w-7xl mx-auto">
        <div className="mt-3 md:mt-0 h-[200px]">
          <h4 className="text-center font-bold">F1 Score on the full dataset for {$dataset.replace('_', ' ')}</h4>
          <ComposedReChart data={benchmarkF1Score} />
        </div>
      </div>

      <div className="flex-col-reverse md:flex md:flex-row-reverse md:items-center md:gap-16 py-5 md:py-5">
        <div className="md:basis-1/2 md:self-center mt-5 sm:mt-0">
          <div className="text-lg max-w-[500px] dark:text-slate-400 mx-auto">
            <h4 className="text-center text-2xl font-bold">Choose a model</h4>

            <div className="flex flex-col mt-3 md:mt-0 justify-center">
              <ButtonChooseModel
                setDataset={model.set}
                dataset={$model}
                dataset_name="baseline"
                txt_name="Baseline"
                color={COLORS[3]}
              />
              <ButtonChooseModel
                setDataset={model.set}
                dataset={$model}
                dataset_name="baseline-ei"
                txt_name="Baseline Edge Impulse converted"
                color={COLORS[0]}
              />
              <ButtonChooseModel
                setDataset={model.set}
                dataset={$model}
                dataset_name="efficientad"
                txt_name="Efficient AD"
                color={COLORS[1]}
              />
              <ButtonChooseModel
                setDataset={model.set}
                dataset={$model}
                dataset_name="fomoad"
                txt_name="FOMO AD"
                color={COLORS[2]}
              />
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-0 md:basis-1/2 md:self-center mx-auto">
          <div className="relative m-auto max-w-4xl">
            <div className="max-w-[600px] mx-auto mt-3 md:mt-0 h-[240px]">
              <h4 className="text-center font-bold">F1 Score per difficulty</h4>
              <SimpleRadialBarReChart data={benchmarkF1ScoreBaseline} />
            </div>
          </div>
        </div>
      </div> 

      <div className="mx-auto md:gap-16 py-12 p-4 md:py-10 max-w-7xl">
        <h4 className="text-center font-bold mb-5">Table representing the full dataset and model selected</h4>
        <div
          className={theme == 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} // applying the grid theme
          style={{ width: '100%', height: window.innerWidth > 768 ? '1500px' : '400px' }}
        >
          <AgGridTable />
        </div>
      </div>
    </>
  );
}
