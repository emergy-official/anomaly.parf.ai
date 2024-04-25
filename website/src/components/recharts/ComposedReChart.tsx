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
    <ul className="text-center">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} style={{ color: entry.color }}>
          {entry.value}
        </li>
      ))}
    </ul>
  );
};

const CustomBarLabel = (props) => {
  const { x, y, width, value } = props;
  const newX = x + width + 5; // Adjust this pixel value to position the label correctly
  if (width < 5) return null; // Optionally hide label for very small bars

  return (
    <text x={newX} y={y} dy={14} fill="#666" fontSize={14} textAnchor="start">
      {value}
    </text>
  );
};

export default function VerticalComposedChart({ ...props }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart layout="vertical" width={1200} height={220} data={props.data} margin={{ left: 10, right: 80 }}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis type="number" domain={[0, 1]} />
        <YAxis dataKey="name" type="category" width={100} />
        <Tooltip />
        <Bar dataKey="F1 score" barSize={25} label={{ position: 'right' }}>
          {props.data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % 20]} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}
