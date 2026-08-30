"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#121a24",
  border: "1px solid #2a3644",
  borderRadius: 12,
  color: "#e6edf3",
};

export function TrendChart({
  data,
}: {
  data: Array<{
    month: string;
    total: number;
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
  }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="totalFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3fb950" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2a3644" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#8b949e" fontSize={12} />
          <YAxis stroke="#8b949e" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="total" stroke="#3fb950" fill="url(#totalFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TypeBreakdownChart({
  data,
}: {
  data: Array<{ month: string; commits: number; pullRequests: number; issues: number; reviews: number }>;
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="#2a3644" strokeDasharray="3 3" />
          <XAxis dataKey="month" stroke="#8b949e" fontSize={12} />
          <YAxis stroke="#8b949e" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          <Bar dataKey="commits" stackId="a" fill="#3fb950" />
          <Bar dataKey="pullRequests" stackId="a" fill="#58a6ff" />
          <Bar dataKey="issues" stackId="a" fill="#d2a8ff" />
          <Bar dataKey="reviews" stackId="a" fill="#f0883e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LanguagePieChart({
  data,
}: {
  data: Array<{ name: string; value: number; color?: string | null }>;
}) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={110} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color || "#3fb950"} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LanguageTrendChart({
  data,
  languages,
}: {
  data: Array<Record<string, string | number>>;
  languages: string[];
}) {
  const palette = ["#3fb950", "#58a6ff", "#d2a8ff", "#f0883e", "#ff7b72", "#79c0ff"];
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#2a3644" strokeDasharray="3 3" />
          <XAxis dataKey="year" stroke="#8b949e" fontSize={12} />
          <YAxis stroke="#8b949e" fontSize={12} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend />
          {languages.map((language, index) => (
            <Line
              key={language}
              type="monotone"
              dataKey={language}
              stroke={palette[index % palette.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
