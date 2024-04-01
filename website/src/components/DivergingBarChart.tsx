// import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import Chart from 'chart.js/auto';

function formatDate(datestring: string) {
    const date = new Date(parseInt(`${datestring}`))
    // const day = `${date.getDate()}`.padStart(2, '0');
    // const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `${hours}:${minutes}`;
    // return `${day}/${month} ${hours}:${minutes}`;
}

const DivergingBarChart = ({ fbData }) => {


    let feedbackData = fbData?.map((e: any) => ({
        feedback: e.feedback ? 1 : -1,
        text: e.text,
        timestamp: e.timestamp
    })).reverse();

    const chartRef: any = useRef(null);

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');

        // Prepare the datasets  
        let positiveDataset: any = [];
        let negativeDataset: any = [];
        let labels: any = [];

        feedbackData.forEach((item: any) => {

            labels.push(formatDate(item.timestamp));

            if (item.feedback > 0) {
                positiveDataset.push(item.feedback);
                negativeDataset.push(0);
            } else {
                negativeDataset.push(item.feedback);
                positiveDataset.push(0);
            }
        });

        const data = {
            labels,
            datasets: [
                {
                    label: 'Negative Feedback',
                    data: negativeDataset,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                },
                {
                    label: 'Positive Feedback',
                    data: positiveDataset,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                },
            ],
        };

        const options = {
            responsive: true,
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    beginAtZero: true,
                    stacked: true,
                },
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context: any) {
                            const index = context.dataIndex;
                            return `${feedbackData[index].text}`;
                        },
                    },
                },
            },
        };

        new Chart(ctx, {
            type: 'bar',
            data,
            options,
        });
    }, []);

    return <canvas height="50" ref={chartRef} />;
};

export default DivergingBarChart;  