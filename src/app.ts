// ============================================================================
// Type Definitions
// ============================================================================

interface WeightEntry {
  weight: number;
  timestamp: string;
}

interface JournalEntry {
  filename: string;
  timestamp: string;
  html: string;
}

interface JournalEntryResponse extends JournalEntry {
  content: string;
}

interface ErrorResponse {
  error: string;
}

interface ChartDataPoint {
  x: Date;
  y: number;
}

type MessageType = 'success' | 'error';

// ============================================================================
// Chart.js Global Declaration
// ============================================================================

import type { Chart as ChartType, ChartConfiguration } from 'chart.js';

declare global {
  interface Window {
    Chart: typeof ChartType;
  }
}

const Chart = window.Chart;

// ============================================================================
// Type Guards
// ============================================================================

function isErrorResponse(data: unknown): data is ErrorResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof (data as ErrorResponse).error === 'string'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id) as T | null;
  if (!element) {
    throw new Error(`Element with id "${id}" not found`);
  }
  return element;
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function showMessage(text: string, type: MessageType = 'success', elementId: string = 'message'): void {
  const messageEl = getElement<HTMLDivElement>(elementId);
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.style.display = 'block';

  setTimeout(() => {
    messageEl.style.display = 'none';
  }, 3000);
}

// ============================================================================
// Weight Tracking
// ============================================================================

let weightChart: ChartType<'line', ChartDataPoint[]> | null = null;

async function fetchWeights(): Promise<WeightEntry[]> {
  try {
    const response = await fetch('/api/weights');
    if (!response.ok) {
      throw new Error('Failed to fetch weights');
    }
    const data: unknown = await response.json();
    return data as WeightEntry[];
  } catch (error) {
    console.error('Error fetching weights:', error);
    showMessage('Error loading weight data', 'error');
    return [];
  }
}

async function submitWeight(weight: number): Promise<WeightEntry> {
  try {
    const response = await fetch('/api/weights', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weight }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      if (isErrorResponse(errorData)) {
        throw new Error(errorData.error);
      }
      throw new Error('Failed to submit weight');
    }

    const data: unknown = await response.json();
    return data as WeightEntry;
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

async function updateChart(): Promise<void> {
  const data = await fetchWeights();
  renderChart(data);
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

// ============================================================================
// Journal
// ============================================================================

async function fetchJournalEntries(): Promise<JournalEntry[]> {
  try {
    const response = await fetch('/api/journal');
    if (!response.ok) {
      throw new Error('Failed to fetch journal entries');
    }
    const data: unknown = await response.json();
    return data as JournalEntry[];
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    showMessage('Error loading journal entries', 'error', 'journal-message');
    return [];
  }
}

async function submitJournalEntry(content: string): Promise<JournalEntryResponse> {
  try {
    const response = await fetch('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content.trim() }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      if (isErrorResponse(errorData)) {
        throw new Error(errorData.error);
      }
      throw new Error('Failed to submit journal entry');
    }

    const data: unknown = await response.json();
    return data as JournalEntryResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting journal entry:', error);
    showMessage(message, 'error', 'journal-message');
    throw error;
  }
}

function renderJournalEntries(entries: JournalEntry[]): void {
  const listEl = getElement<HTMLDivElement>('journal-list');

  if (entries.length === 0) {
    listEl.innerHTML = '<p class="no-entries">No journal entries yet. Write your first entry above!</p>';
    return;
  }

  listEl.innerHTML = entries.map(entry => `
    <div class="journal-entry" data-filename="${entry.filename}">
      <div class="entry-header">
        <span class="entry-date">${formatDate(entry.timestamp)}</span>
      </div>
      <div class="entry-content">
        ${entry.html}
      </div>
    </div>
  `).join('');
}

async function updateJournalList(): Promise<void> {
  const entries = await fetchJournalEntries();
  renderJournalEntries(entries);
}

async function handleJournalSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const contentInput = getElement<HTMLTextAreaElement>('journal-input');
  const content = contentInput.value.trim();

  if (!content) {
    showMessage('Please enter some content', 'error', 'journal-message');
    return;
  }

  try {
    await submitJournalEntry(content);
    showMessage('Journal entry added successfully!', 'success', 'journal-message');
    contentInput.value = '';
    contentInput.focus();
    await updateJournalList();
  } catch (error) {
    // Error already shown in submitJournalEntry function
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Load and render initial chart
  await updateChart();

  // Set up weight form submission handler
  const weightForm = getElement<HTMLFormElement>('weight-form');
  weightForm.addEventListener('submit', handleFormSubmit);

  // Load and render journal entries
  await updateJournalList();

  // Set up journal form submission handler
  const journalForm = getElement<HTMLFormElement>('journal-form');
  journalForm.addEventListener('submit', handleJournalSubmit);
});
