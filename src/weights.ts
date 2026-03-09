import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
import { apiRequest } from './api/client.js';
import type { WeightEntry } from './api/types.js';
import { calculateWeightSummary } from './lib/summary.js';
import { getElement, showMessage } from './shared.js';

interface ChartDataPoint {
  x: Date;
  y: number;
}

declare global {
  interface Window {
    Chart: typeof ChartType;
  }
}

const Chart = window.Chart;
let weightChart: ChartType<'line', ChartDataPoint[]> | null = null;

function updateWeightSummary(entries: WeightEntry[]): void {
  const latestEl = document.getElementById('metric-latest-weight');
  const deltaEl = document.getElementById('metric-weight-delta');

  if (!latestEl || !deltaEl) {
    return;
  }

  const summary = calculateWeightSummary(entries);
  latestEl.textContent = summary.latest;
  deltaEl.textContent = summary.delta7d;
}

async function fetchWeights(): Promise<WeightEntry[]> {
  try {
    return await apiRequest<WeightEntry[]>('/api/weights');
  } catch (error) {
    console.error('Error fetching weights:', error);
    showMessage('Error loading weight data', 'error');
    return [];
  }
}

async function submitWeight(weight: number): Promise<WeightEntry> {
  try {
    return await apiRequest<WeightEntry>('/api/weights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weight }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting weight:', error);
    showMessage(message, 'error');
    throw error;
  }
}

function renderChart(data: WeightEntry[]): void {
  const canvas = getElement<HTMLCanvasElement>('weight-chart');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get 2d context from canvas');
  }

  const chartData: ChartDataPoint[] = data.map(entry => ({
    x: new Date(entry.timestamp),
    y: entry.weight
  }));

  if (weightChart) {
    weightChart.destroy();
  }

  const config: ChartConfiguration<'line', ChartDataPoint[]> = {
    type: 'line',
    data: {
      datasets: [{
        label: 'Weight (lbs)',
        data: chartData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Weight (lbs)'
          }
        },
        x: {
          type: 'time',
          time: {
            unit: 'day',
            displayFormats: {
              day: 'MMM d'
            },
            tooltipFormat: 'MMM d, yyyy'
          },
          title: {
            display: true,
            text: 'Date'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        }
      }
    }
  };

  weightChart = new Chart(ctx, config);
}

async function updateChart(): Promise<WeightEntry[]> {
  const data = await fetchWeights();
  renderChart(data);
  updateWeightSummary(data);
  return data;
}

async function handleFormSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const weightInput = getElement<HTMLInputElement>('weight-input');
  const weight = weightInput.value;

  if (!weight || parseFloat(weight) <= 0) {
    showMessage('Please enter a valid weight', 'error');
    return;
  }

  try {
    await submitWeight(parseFloat(weight));
    showMessage('Weight entry added successfully!', 'success');
    weightInput.value = '';
    weightInput.focus();
    await updateChart();
  } catch (error) {
    // Error already shown in submitWeight function
  }
}

export async function initWeights(): Promise<void> {
  const weightForm = document.getElementById('weight-form') as HTMLFormElement | null;
  const weightChartEl = document.getElementById('weight-chart');

  if (!weightForm || !weightChartEl) {
    return;
  }

  await updateChart();
  weightForm.addEventListener('submit', handleFormSubmit);
}
