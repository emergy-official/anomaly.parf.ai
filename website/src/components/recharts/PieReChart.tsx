import { PieChart, Pie, Legend, Cell, Tooltip } from 'recharts';
import { COLORS } from '~/utils/stats/stats';

export default function PieReChart({ ...props }) {
  return (
    <PieChart width={600} height={300}>
      <Pie dataKey="value" data={props.data} innerRadius={60} outerRadius={80} paddingAngle={30} label>
        {props.data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
