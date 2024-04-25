import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from 'recharts';

import { COLORS } from '~/utils/stats/stats';

const renderLegend = (props) => {
  const { payload } = props;

  return (
    <ul className="text-center">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ color: entry.color }}>
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

const style = {
  top: '50%',
  right: 0,
  transform: 'translate(0, -50%)',
  lineHeight: '24px',
};
export default function SimpleRadialBarReChart({ ...props }) {
  return (
    <RadialBarChart
      width={600}
      height={520}
      cx="50%"
      cy="50%"
      innerRadius="10%"
      outerRadius="80%"
      barSize={22}
      data={props.data}
    >
      <RadialBar  label={{ position: 'outside' }} background dataKey="F1 score" />
      <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} />
      <Tooltip />
    </RadialBarChart>
  );
}
