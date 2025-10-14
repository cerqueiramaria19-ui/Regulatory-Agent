

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Corrected import path to be relative
import { Requirement, Priority } from '../types';
import { PRIORITY_COLORS } from '../constants';

interface PriorityPieChartProps {
  data: Requirement[];
}

export const PriorityPieChart: React.FC<PriorityPieChartProps> = ({ data }) => {
  const chartData = Object.values(Priority).map(priority => ({
    name: priority,
    value: data.filter(r => r.priority === priority).length
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
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as Priority]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};
