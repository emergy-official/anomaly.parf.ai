import { PieChart, Pie, Legend, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { COLORS } from '~/utils/stats/stats';

export default function PieReChart({ ...props }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart accessibilityLayer width={100} height={100} title="Breakdown of Categories">
        <Pie dataKey="value" data={props.data} innerRadius={60} outerRadius={80} paddingAngle={30} label>
          {props.data.map((entry, index) => {
            console.log(entry);
            return (
              <Cell
                role="img"
                aria-label={`${entry.name} - ${entry.value}`}
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            );
          })}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
