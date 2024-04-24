import { AgGridReact } from 'ag-grid-react'; // AG Grid Component
import { useEffect, useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 100, pv: 2400, amt: 2400 },
  { name: 'Page B', uv: 300, pv: 100, amt: 2400 },
];
const BoldRenderer = (props) => {
  return <div>{props.value}</div>;
};
export default function DatasetReactDetail({ ...props }) {
  const [rowData, setRowData] = useState([
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false },
    { make: 'Toyota', model: 'test', price: 29600, electric: false },
  ]);

  // Column Definitions: Defines the columns to be displayed.
  const [theme, setTheme]: any = useState('');
  const [colDefs, setColDefs]: any = useState([
    { field: 'make' },
    { field: 'model', cellRenderer: BoldRenderer },
    { field: 'price' },
    { field: 'electric' },
  ]);
  useEffect(() => {
    setTheme(window.localStorage.theme);
    // const element1: any = document.getElementById('acquisitions');
    // console.log('ELEMENT1', element1);
    // new Chart(element1, {
    //   type: 'bar',
    //   data: {
    //     labels: data.map((row) => row.year),
    //     datasets: [
    //       {
    //         label: 'Acquisitions by year',
    //         data: data.map((row) => row.count),
    //       },
    //     ],
    //   },
    // });
  }, []);

  return (
    <>
      <div className="text-center md:gap-16 py-12 md:py-10">
        <h3 className="text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
          <span className="text-accent dark:text-white highlight">Dataset</span> Explorer
        </h3>
        {/* <div style="width: 800px;">
        <canvas id="acquisitions"></canvas>
      </div> */}
      </div>
      <div className="md:gap-16 py-12 md:py-10">
        <div
          className={theme == 'dark' ? 'ag-theme-quartz-dark' : 'ag-theme-quartz'} // applying the grid theme
          style={{ height: 500 }} // the grid will fill the size of the parent container
        >
          <AgGridReact rowData={rowData} columnDefs={colDefs} rowHeight={300} />
        </div>
        <LineChart width={600} height={300} data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </LineChart>
      </div>
    </>
  );
}
