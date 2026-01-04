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

type WorkoutType = "Running" | "Weights" | "Swim" | "Yoga";

interface WorkoutEntry {
  timestamp: string;
  workout_type: WorkoutType;
  note: string;
}

interface WorkoutsByDate {
  [date: string]: WorkoutEntry[];
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
// Workout Tracking
// ============================================================================

async function fetchWorkouts(): Promise<WorkoutEntry[]> {
  try {
    const response = await fetch('/api/workouts');
    if (!response.ok) {
      throw new Error('Failed to fetch workouts');
    }
    const data: unknown = await response.json();
    return data as WorkoutEntry[];
  } catch (error) {
    console.error('Error fetching workouts:', error);
    showMessage('Error loading workout data', 'error', 'workout-message');
    return [];
  }
}

async function submitWorkout(workoutType: WorkoutType, note: string): Promise<WorkoutEntry> {
  try {
    const response = await fetch('/api/workouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workout_type: workoutType,
        note: note.trim()
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      if (isErrorResponse(errorData)) {
        throw new Error(errorData.error);
      }
      throw new Error('Failed to submit workout');
    }

    const data: unknown = await response.json();
    return data as WorkoutEntry;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting workout:', error);
    showMessage(message, 'error', 'workout-message');
    throw error;
  }
}

function groupWorkoutsByDate(workouts: WorkoutEntry[]): WorkoutsByDate {
  const grouped: WorkoutsByDate = {};

  workouts.forEach(workout => {
    const date = new Date(workout.timestamp);
    const dateKey = formatDateKey(date);

    if (!dateKey) return;

    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey]!.push(workout);
  });

  return grouped;
}

function getWorkoutBadgeClass(workoutType: WorkoutType): string {
  const classMap: Record<WorkoutType, string> = {
    'Running': 'workout-badge-running',
    'Weights': 'workout-badge-weights',
    'Swim': 'workout-badge-swim',
    'Yoga': 'workout-badge-yoga'
  };
  return classMap[workoutType];
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0] ?? '';
}

function renderWorkoutTimeline(workouts: WorkoutEntry[]): void {
  const timelineEl = getElement<HTMLDivElement>('workout-timeline');

  if (workouts.length === 0) {
    timelineEl.innerHTML = '<p class="no-entries">No workouts logged yet. Add your first workout above!</p>';
    return;
  }

  const grouped = groupWorkoutsByDate(workouts);
  const sortedDates = Object.keys(grouped).sort().reverse();

  const html = sortedDates.map(dateKey => {
    const dateWorkouts = grouped[dateKey];
    if (!dateWorkouts || dateWorkouts.length === 0) return '';

    const formattedDate = formatDate(dateWorkouts[0]!.timestamp);

    const workoutItems = dateWorkouts.map(workout => `
      <div class="workout-item">
        <div class="workout-header">
          <span class="workout-badge ${getWorkoutBadgeClass(workout.workout_type)}">
            ${workout.workout_type}
          </span>
          <span class="workout-time">${formatTime(workout.timestamp)}</span>
        </div>
        ${workout.note ? `<div class="workout-note">${escapeHtml(workout.note)}</div>` : ''}
      </div>
    `).join('');

    return `
      <div class="timeline-date-group">
        <h4 class="timeline-date">${formattedDate}</h4>
        <div class="workout-list">
          ${workoutItems}
        </div>
      </div>
    `;
  }).join('');

  timelineEl.innerHTML = html;
}

function renderWorkoutCalendar(workouts: WorkoutEntry[]): void {
  const calendarEl = getElement<HTMLDivElement>('workout-calendar');
  const workoutDays = new Map<string, Set<WorkoutType>>();

  workouts.forEach(workout => {
    const dateKey = formatDateKey(new Date(workout.timestamp));
    if (dateKey) {
      if (!workoutDays.has(dateKey)) {
        workoutDays.set(dateKey, new Set<WorkoutType>());
      }
      workoutDays.get(dateKey)!.add(workout.workout_type);
    }
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previousMonthDate = new Date(currentYear, currentMonth - 1, 1);

  const months = [
    { year: previousMonthDate.getFullYear(), month: previousMonthDate.getMonth() },
    { year: currentYear, month: currentMonth }
  ];

  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthHtml = months.map(({ year, month }) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const startDay = monthStart.getDay();

    const title = monthStart.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });

    const cells: string[] = [];

    weekdayLabels.forEach(label => {
      cells.push(`<div class="calendar-header">${label}</div>`);
    });

    for (let i = 0; i < startDay; i += 1) {
      cells.push('<div class="calendar-day empty"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = formatDateKey(new Date(year, month, day));
      const typesForDay = workoutDays.get(dateKey);
      const hasWorkout = Boolean(typesForDay && typesForDay.size > 0);
      const dayClass = hasWorkout ? 'calendar-day has-workout' : 'calendar-day';
      const titleAttr = hasWorkout ? ' title="Workout logged"' : '';
      const swatches = typesForDay
        ? Array.from(typesForDay).map(type => {
            const badgeClass = getWorkoutBadgeClass(type);
            return `<span class="calendar-swatch ${badgeClass}"></span>`;
          }).join('')
        : '';
      cells.push(`
        <div class="${dayClass}"${titleAttr}>
          <span class="calendar-day-number">${day}</span>
          ${swatches ? `<span class="calendar-swatches">${swatches}</span>` : ''}
        </div>
      `);
    }

    return `
      <div class="calendar-month">
        <div class="calendar-title">${title}</div>
        <div class="calendar-grid">
          ${cells.join('')}
        </div>
      </div>
    `;
  }).join('');

  calendarEl.innerHTML = monthHtml;
}

async function updateWorkoutTimeline(): Promise<void> {
  const workouts = await fetchWorkouts();
  renderWorkoutTimeline(workouts);
  renderWorkoutCalendar(workouts);
}

async function handleWorkoutSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const typeSelect = getElement<HTMLSelectElement>('workout-type');
  const noteInput = getElement<HTMLTextAreaElement>('workout-note');

  const workoutType = typeSelect.value as WorkoutType;
  const note = noteInput.value.trim();

  if (!workoutType) {
    showMessage('Please select a workout type', 'error', 'workout-message');
    return;
  }

  try {
    await submitWorkout(workoutType, note);
    showMessage('Workout logged successfully!', 'success', 'workout-message');

    typeSelect.value = '';
    noteInput.value = '';
    typeSelect.focus();

    await updateWorkoutTimeline();
  } catch (error) {
    // Error already shown in submitWorkout function
  }
}

// ============================================================================
// Initialization
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  const weightForm = document.getElementById('weight-form') as HTMLFormElement | null;
  const weightChartEl = document.getElementById('weight-chart');
  if (weightForm && weightChartEl) {
    await updateChart();
    weightForm.addEventListener('submit', handleFormSubmit);
  }

  const workoutForm = document.getElementById('workout-form') as HTMLFormElement | null;
  const workoutTimeline = document.getElementById('workout-timeline');
  if (workoutForm && workoutTimeline) {
    await updateWorkoutTimeline();
    workoutForm.addEventListener('submit', handleWorkoutSubmit);
  }

  const journalForm = document.getElementById('journal-form') as HTMLFormElement | null;
  const journalList = document.getElementById('journal-list');
  if (journalForm && journalList) {
    await updateJournalList();
    journalForm.addEventListener('submit', handleJournalSubmit);
  }
});
