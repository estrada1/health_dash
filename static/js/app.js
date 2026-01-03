// ============================================================================
// Type Definitions
// ============================================================================
const Chart = window.Chart;
// ============================================================================
// Type Guards
// ============================================================================
function isErrorResponse(data) {
    return (typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof data.error === 'string');
}
// ============================================================================
// Utility Functions
// ============================================================================
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element;
}
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
function showMessage(text, type = 'success', elementId = 'message') {
    const messageEl = getElement(elementId);
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
let weightChart = null;
async function fetchWeights() {
    try {
        const response = await fetch('/api/weights');
        if (!response.ok) {
            throw new Error('Failed to fetch weights');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching weights:', error);
        showMessage('Error loading weight data', 'error');
        return [];
    }
}
async function submitWeight(weight) {
    try {
        const response = await fetch('/api/weights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weight }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (isErrorResponse(errorData)) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to submit weight');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error submitting weight:', error);
        showMessage(message, 'error');
        throw error;
    }
}
function renderChart(data) {
    const canvas = getElement('weight-chart');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2d context from canvas');
    }
    const chartData = data.map(entry => ({
        x: new Date(entry.timestamp),
        y: entry.weight
    }));
    if (weightChart) {
        weightChart.destroy();
    }
    const config = {
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
async function updateChart() {
    const data = await fetchWeights();
    renderChart(data);
}
async function handleFormSubmit(event) {
    event.preventDefault();
    const weightInput = getElement('weight-input');
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
    }
    catch (error) {
        // Error already shown in submitWeight function
    }
}
// ============================================================================
// Journal
// ============================================================================
async function fetchJournalEntries() {
    try {
        const response = await fetch('/api/journal');
        if (!response.ok) {
            throw new Error('Failed to fetch journal entries');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching journal entries:', error);
        showMessage('Error loading journal entries', 'error', 'journal-message');
        return [];
    }
}
async function submitJournalEntry(content) {
    try {
        const response = await fetch('/api/journal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content: content.trim() }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            if (isErrorResponse(errorData)) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to submit journal entry');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error submitting journal entry:', error);
        showMessage(message, 'error', 'journal-message');
        throw error;
    }
}
function renderJournalEntries(entries) {
    const listEl = getElement('journal-list');
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
async function updateJournalList() {
    const entries = await fetchJournalEntries();
    renderJournalEntries(entries);
}
async function handleJournalSubmit(event) {
    event.preventDefault();
    const contentInput = getElement('journal-input');
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
    }
    catch (error) {
        // Error already shown in submitJournalEntry function
    }
}
// ============================================================================
// Workout Tracking
// ============================================================================
async function fetchWorkouts() {
    try {
        const response = await fetch('/api/workouts');
        if (!response.ok) {
            throw new Error('Failed to fetch workouts');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        console.error('Error fetching workouts:', error);
        showMessage('Error loading workout data', 'error', 'workout-message');
        return [];
    }
}
async function submitWorkout(workoutType, note) {
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
            const errorData = await response.json();
            if (isErrorResponse(errorData)) {
                throw new Error(errorData.error);
            }
            throw new Error('Failed to submit workout');
        }
        const data = await response.json();
        return data;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error submitting workout:', error);
        showMessage(message, 'error', 'workout-message');
        throw error;
    }
}
function groupWorkoutsByDate(workouts) {
    const grouped = {};
    workouts.forEach(workout => {
        const date = new Date(workout.timestamp);
        const dateKey = date.toISOString().split('T')[0];
        if (!dateKey)
            return;
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(workout);
    });
    return grouped;
}
function getWorkoutBadgeClass(workoutType) {
    const classMap = {
        'Running': 'workout-badge-running',
        'Weights': 'workout-badge-weights',
        'Swim': 'workout-badge-swim',
        'Yoga': 'workout-badge-yoga'
    };
    return classMap[workoutType];
}
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
function renderWorkoutTimeline(workouts) {
    const timelineEl = getElement('workout-timeline');
    if (workouts.length === 0) {
        timelineEl.innerHTML = '<p class="no-entries">No workouts logged yet. Add your first workout above!</p>';
        return;
    }
    const grouped = groupWorkoutsByDate(workouts);
    const sortedDates = Object.keys(grouped).sort().reverse();
    const html = sortedDates.map(dateKey => {
        const dateWorkouts = grouped[dateKey];
        if (!dateWorkouts || dateWorkouts.length === 0)
            return '';
        const formattedDate = formatDate(dateWorkouts[0].timestamp);
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
async function updateWorkoutTimeline() {
    const workouts = await fetchWorkouts();
    renderWorkoutTimeline(workouts);
}
async function handleWorkoutSubmit(event) {
    event.preventDefault();
    const typeSelect = getElement('workout-type');
    const noteInput = getElement('workout-note');
    const workoutType = typeSelect.value;
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
    }
    catch (error) {
        // Error already shown in submitWorkout function
    }
}
// ============================================================================
// Initialization
// ============================================================================
document.addEventListener('DOMContentLoaded', async () => {
    const weightForm = document.getElementById('weight-form');
    const weightChartEl = document.getElementById('weight-chart');
    if (weightForm && weightChartEl) {
        await updateChart();
        weightForm.addEventListener('submit', handleFormSubmit);
    }
    const workoutForm = document.getElementById('workout-form');
    const workoutTimeline = document.getElementById('workout-timeline');
    if (workoutForm && workoutTimeline) {
        await updateWorkoutTimeline();
        workoutForm.addEventListener('submit', handleWorkoutSubmit);
    }
    const journalForm = document.getElementById('journal-form');
    const journalList = document.getElementById('journal-list');
    if (journalForm && journalList) {
        await updateJournalList();
        journalForm.addEventListener('submit', handleJournalSubmit);
    }
});
export {};
//# sourceMappingURL=app.js.map