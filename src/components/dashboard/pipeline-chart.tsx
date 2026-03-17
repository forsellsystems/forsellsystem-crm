'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PIPELINE_STAGES } from '@/lib/constants'
import type { PipelineStageSummary } from '@/lib/queries/dashboard'

interface PipelineChartProps {
  data: PipelineStageSummary[]
}

export function PipelineChart({ data }: PipelineChartProps) {
  const chartData = PIPELINE_STAGES.filter(
    (s) => s.key !== 'avslutad_affar' && s.key !== 'avslutad_ingen_affar'
  ).map((stage) => {
    const match = data.find((d) => d.stage === stage.key)
    return {
      name: stage.label,
      value: match ? Number(match.total_value) : 0,
      count: match?.deal_count ?? 0,
      color: stage.color,
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-condensed text-xs tracking-[0.12em] text-[#6B7672]">Pipeline per steg</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.every((d) => d.value === 0 && d.count === 0) ? (
          <div className="flex items-center justify-center h-[250px] text-sm text-[#6B7672]">
            Inga aktiva affärer i pipelinen ännu.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#B8BFBB40" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: '#6B7672' }}
                axisLine={{ stroke: '#B8BFBB' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7672' }}
                axisLine={{ stroke: '#B8BFBB' }}
                tickFormatter={(v) =>
                  v >= 1000000
                    ? `${(v / 1000000).toFixed(1)}M`
                    : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : String(v)
                }
              />
              <Tooltip
                formatter={(value) =>
                  new Intl.NumberFormat('sv-SE', {
                    style: 'currency',
                    currency: 'SEK',
                    maximumFractionDigits: 0,
                  }).format(Number(value))
                }
                labelStyle={{ color: '#1A1F1D', fontWeight: 600 }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #B8BFBB',
                  fontSize: 13,
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
