import React from 'react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface RadarDataPoint {
  metric: string;
  [key: string]: string | number;
}

interface ComparisonRadarChartProps {
  data: RadarDataPoint[];
  products: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export const ComparisonRadarChart: React.FC<ComparisonRadarChartProps> = ({ data, products }) => {
  return (
    <ResponsiveContainer width="100%" height={400}>
      <RadarChart data={data}>
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis 
          dataKey="metric" 
          tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
        />
        <PolarRadiusAxis 
          domain={[0, 10]} 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
        />
        
        {products.map((product, index) => (
          <Radar
            key={product.id}
            name={product.name}
            dataKey={product.id}
            stroke={product.color}
            fill={product.color}
            fillOpacity={0.3}
            strokeWidth={2}
          />
        ))}
        
        <Legend 
          wrapperStyle={{ fontSize: '12px' }}
          iconType="circle"
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
