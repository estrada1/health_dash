import {
  escapeHtml,
  formatDate,
  formatTime,
  getElement,
  isErrorResponse,
  showMessage
} from './shared.js';

interface MealEntry {
  timestamp: string;
  title: string;
  calories: number | null;
  notes: string;
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateMealSummary(entries: MealEntry[]): void {
  const mealsTodayEl = document.getElementById('metric-meals-today');
  const caloriesTodayEl = document.getElementById('metric-calories-today');
  const caloriesWeekEl = document.getElementById('metric-calories-week');

  if (!mealsTodayEl || !caloriesTodayEl || !caloriesWeekEl) {
    return;
  }

  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const sevenDayTotals = new Map<string, number>();

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    sevenDayTotals.set(getLocalDateKey(date), 0);
  }

  let mealsToday = 0;
  let caloriesToday = 0;

  entries.forEach(entry => {
    const entryDate = new Date(entry.timestamp);
    const dateKey = getLocalDateKey(entryDate);

    if (dateKey === todayKey) {
      mealsToday += 1;
      caloriesToday += entry.calories ?? 0;
    }

    if (sevenDayTotals.has(dateKey)) {
      sevenDayTotals.set(dateKey, (sevenDayTotals.get(dateKey) ?? 0) + (entry.calories ?? 0));
    }
  });

  const sevenDayAverage = Array.from(sevenDayTotals.values()).reduce((sum, value) => sum + value, 0) / 7;

  mealsTodayEl.textContent = String(mealsToday);
  caloriesTodayEl.textContent = `${caloriesToday} kcal`;
  caloriesWeekEl.textContent = `${Math.round(sevenDayAverage)} kcal`;
}

async function fetchMeals(): Promise<MealEntry[]> {
  try {
    const response = await fetch('/api/meals');
    if (!response.ok) {
      throw new Error('Failed to fetch meals');
    }
    const data: unknown = await response.json();
    return data as MealEntry[];
  } catch (error) {
    console.error('Error fetching meals:', error);
    showMessage('Error loading meal data', 'error', 'meal-message');
    return [];
  }
}

async function submitMeal(
  title: string,
  calories: string,
  notes: string
): Promise<MealEntry> {
  try {
    const response = await fetch('/api/meals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title.trim(),
        calories: calories ? parseInt(calories, 10) : null,
        notes: notes.trim()
      }),
    });

    if (!response.ok) {
      const errorData: unknown = await response.json();
      if (isErrorResponse(errorData)) {
        throw new Error(errorData.error);
      }
      throw new Error('Failed to submit meal');
    }

    const data: unknown = await response.json();
    return data as MealEntry;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting meal:', error);
    showMessage(message, 'error', 'meal-message');
    throw error;
  }
}

function renderMeals(entries: MealEntry[]): void {
  const listEl = getElement<HTMLDivElement>('meal-list');

  if (entries.length === 0) {
    listEl.innerHTML = '<p class="no-entries">No meals logged yet. Add your first meal above!</p>';
    return;
  }

  const html = entries.slice().reverse().map(entry => `
    <div class="meal-entry">
      <div class="meal-header">
        <div class="meal-title">${escapeHtml(entry.title)}</div>
        <div class="meal-meta">
          <span class="meal-date">${formatDate(entry.timestamp)}</span>
          <span class="meal-time">${formatTime(entry.timestamp)}</span>
          ${entry.calories !== null ? `<span class="meal-kcal">${entry.calories} kcal</span>` : ''}
        </div>
      </div>
      ${entry.notes ? `<div class="meal-notes">${escapeHtml(entry.notes)}</div>` : ''}
    </div>
  `).join('');

  listEl.innerHTML = html;
}

async function updateMealList(): Promise<void> {
  const meals = await fetchMeals();
  renderMeals(meals);
  updateMealSummary(meals);
}

async function handleMealSubmit(event: SubmitEvent): Promise<void> {
  event.preventDefault();

  const titleInput = getElement<HTMLInputElement>('meal-title');
  const caloriesInput = getElement<HTMLInputElement>('meal-calories');
  const notesInput = getElement<HTMLTextAreaElement>('meal-notes');

  const title = titleInput.value.trim();
  const calories = caloriesInput.value;
  const notes = notesInput.value.trim();

  if (!title) {
    showMessage('Please enter a meal title', 'error', 'meal-message');
    return;
  }

  try {
    await submitMeal(title, calories, notes);
    showMessage('Meal logged successfully!', 'success', 'meal-message');
    titleInput.value = '';
    caloriesInput.value = '';
    notesInput.value = '';
    titleInput.focus();
    await updateMealList();
  } catch (error) {
    // Error already shown in submitMeal
  }
}

export async function initDiet(): Promise<void> {
  const mealForm = document.getElementById('meal-form') as HTMLFormElement | null;
  const mealList = document.getElementById('meal-list');

  if (!mealForm || !mealList) {
    return;
  }

  await updateMealList();
  mealForm.addEventListener('submit', handleMealSubmit);
}
