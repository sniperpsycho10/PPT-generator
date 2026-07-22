"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardChartsProps {
  trendLabels: string[];
  bestPracticesData: number[];
  repetitiveProblemsData: number[];
  impactLabels: string[];
  impactDataValues: number[];
}

export default function DashboardCharts({
  trendLabels,
  bestPracticesData,
  repetitiveProblemsData,
  impactLabels,
  impactDataValues
}: DashboardChartsProps) {
  const trendOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: true, text: 'Submission Trends (Last 6 Months)' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const trendDataObj = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Best Practices',
        data: bestPracticesData,
        borderColor: 'rgba(10, 61, 98, 1)',
        backgroundColor: 'rgba(10, 61, 98, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Repetitive Problems',
        data: repetitiveProblemsData,
        borderColor: 'rgba(255, 127, 80, 1)',
        backgroundColor: 'rgba(255, 127, 80, 0.2)',
        fill: true,
        tension: 0.4
      },
    ],
  };

  const impactOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Impact / Savings by Department (Rs. Lakhs)' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const impactDataObj = {
    labels: impactLabels,
    datasets: [
      {
        label: 'Savings (Rs. Lakhs)',
        data: impactDataValues,
        backgroundColor: [
          'rgba(10, 61, 98, 0.8)',
          'rgba(255, 127, 80, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
      }
    ]
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
      <div className="card glass" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
        <Line options={trendOptions} data={trendDataObj} />
      </div>
      <div className="card glass" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
        {impactLabels.length > 0 ? (
           <Bar options={impactOptions} data={impactDataObj} />
        ) : (
           <div style={{ textAlign: 'center', color: '#999', marginTop: '2rem' }}>No impact data available</div>
        )}
      </div>
    </div>
  );
}
