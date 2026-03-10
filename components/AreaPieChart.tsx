
import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Corrected import path to be relative
import { Requirement, Area } from '../types';
import { AREA_COLORS } from '../constants';

interface AreaPieChartProps {
  data: Requirement[];
}

export const AreaPieChart: React.FC<AreaPieChartProps> = ({ data }) => {
  const chartData = Object.values(Area).map(area => ({
    name: area,
    value: data.filter(r => r.area === area).length
  })).filter(d => d.value > 0);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                  <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                      {`${(percent * 100).toFixed(0)}%`}
                  </text>
              );
          }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={AREA_COLORS[entry.name as Area]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
