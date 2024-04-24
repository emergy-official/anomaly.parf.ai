import React from 'react';
import { useEffect } from 'react';

export default function DatasetReactDetail() {

  useEffect(() => {
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
    <div className="text-center md:gap-16 py-12 md:py-10">
      <h3 className="text-2xl font-bold tracking-tight dark:text-white sm:text-3xl mb-2">
        <span className="text-accent dark:text-white highlight">Dataset</span> Explorer
      </h3>
      {/* <div style="width: 800px;">
        <canvas id="acquisitions"></canvas>
      </div> */}
    </div>
  );
}
