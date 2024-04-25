import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { COLORS } from '~/utils/stats/stats';

export default function SimpleBarReChart({ ...props }) {
  return (
    <BarChart
      width={800}
      height={300}
      data={props.data}
      margin={{
        top: 5,
        right: 30,
        left: 20,
        bottom: 5,
      }}
    >
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="no anomaly" fill={COLORS[0]} />
      <Bar dataKey="easy" fill={COLORS[3]} />
      <Bar dataKey="medium" fill={COLORS[1]} />
      <Bar dataKey="hard" fill={COLORS[2]} />
    </BarChart>
  );
}
