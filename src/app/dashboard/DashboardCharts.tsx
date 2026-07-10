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

export default function DashboardCharts() {
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

  const trendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Best Practices',
        data: [12, 19, 15, 22, 28, 24],
        borderColor: 'rgba(10, 61, 98, 1)',
        backgroundColor: 'rgba(10, 61, 98, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Repetitive Problems',
        data: [5, 8, 4, 10, 6, 7],
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

  const impactData = {
    labels: ['Rail Mill', 'Plate Mill', 'Steel Melting', 'Power Plant', 'Coke Oven'],
    datasets: [
      {
        label: 'Savings (Rs. Lakhs)',
        data: [26.45, 20.0, 15.5, 30.2, 10.1],
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
        <Line options={trendOptions} data={trendData} />
      </div>
      <div className="card glass" style={{ padding: '1.5rem', backgroundColor: '#fff' }}>
        <Bar options={impactOptions} data={impactData} />
      </div>
    </div>
  );
}
