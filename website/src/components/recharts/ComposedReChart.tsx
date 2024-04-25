import {
  ComposedChart,
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { COLORS } from '~/utils/stats/stats';

const renderLegend = (props) => {
  const { payload } = props;

  return (
    <ul className='text-center'>
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ color: entry.color }}>
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

export default function VerticalComposedChart({ ...props }) {
  return (
    <ComposedChart layout="vertical" width={1400} height={220} data={props.data}>
      <CartesianGrid stroke="#f5f5f5" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width={100} />
      <Tooltip />
      <Bar dataKey="F1 score" barSize={20} label={{ position: 'right' }}>
        {props.data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % 20]} />
        ))}
      </Bar>
      <Legend content={renderLegend} />
    </ComposedChart>
  );
}
