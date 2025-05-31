"use client";

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { UserRoleDistribution } from "~/server/data/analytics";

interface RoleDistributionChartProps {
  data: UserRoleDistribution;
}

const COLORS = ["#0088FE", "#FFBB28"];

export default function RoleDistributionChart({ data }: RoleDistributionChartProps) {
  const chartData = [
    { name: "Admins", value: data.ADMIN },
    { name: "Users", value: data.USER },
  ].filter(item => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height="150%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
