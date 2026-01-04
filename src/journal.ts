import { formatDate, getElement, isErrorResponse, showMessage } from './shared.js';

interface JournalEntry {
  filename: string;
  timestamp: string;
  html: string;
}

interface JournalEntryResponse extends JournalEntry {
  content: string;
}

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

export async function initJournal(): Promise<void> {
  const journalForm = document.getElementById('journal-form') as HTMLFormElement | null;
  const journalList = document.getElementById('journal-list');

  if (!journalForm || !journalList) {
    return;
  }

  await updateJournalList();
  journalForm.addEventListener('submit', handleJournalSubmit);
}
