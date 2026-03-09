import { apiRequest } from './api/client.js';
import type { JournalEntry, JournalEntryWithContent } from './api/types.js';
import { calculateJournalSummary } from './lib/summary.js';
import { formatDate, getElement, showMessage } from './shared.js';

function updateJournalSummary(entries: JournalEntry[]): void {
  const totalEl = document.getElementById('metric-journal-total');
  const latestEl = document.getElementById('metric-journal-latest');

  if (!totalEl || !latestEl) {
    return;
  }

  const summary = calculateJournalSummary(entries, formatDate);
  totalEl.textContent = summary.total;
  latestEl.textContent = summary.latest;
}

async function fetchJournalEntries(): Promise<JournalEntry[]> {
  try {
    return await apiRequest<JournalEntry[]>('/api/journal');
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    showMessage('Error loading journal entries', 'error', 'journal-message');
    return [];
  }
}

async function fetchJournalEntry(filename: string): Promise<JournalEntryWithContent> {
  try {
    return await apiRequest<JournalEntryWithContent>(`/api/journal/${filename}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching journal entry:', error);
    showMessage(message, 'error', 'journal-message');
    throw error;
  }
}

async function submitJournalEntry(content: string): Promise<JournalEntryWithContent> {
  try {
    return await apiRequest<JournalEntryWithContent>('/api/journal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content.trim() }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error submitting journal entry:', error);
    showMessage(message, 'error', 'journal-message');
    throw error;
  }
}

async function updateJournalEntry(filename: string, content: string): Promise<JournalEntryWithContent> {
  try {
    return await apiRequest<JournalEntryWithContent>(`/api/journal/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: content.trim() }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating journal entry:', error);
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
        <div class="entry-actions">
          <button class="entry-action" data-action="edit" type="button">Edit</button>
          <button class="entry-action" data-action="save" type="button" hidden>Save</button>
          <button class="entry-action" data-action="cancel" type="button" hidden>Cancel</button>
        </div>
      </div>
      <div class="entry-content">
        ${entry.html}
      </div>
      <div class="entry-editor" hidden>
        <textarea class="entry-editor-input" rows="6"></textarea>
      </div>
    </div>
  `).join('');
}

async function updateJournalList(): Promise<void> {
  const entries = await fetchJournalEntries();
  renderJournalEntries(entries);
  updateJournalSummary(entries);
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

async function handleJournalListClick(event: MouseEvent): Promise<void> {
  const target = event.target as HTMLElement | null;
  const actionButton = target?.closest<HTMLButtonElement>('button[data-action]');
  if (!actionButton) {
    return;
  }

  const entryEl = actionButton.closest<HTMLDivElement>('.journal-entry');
  if (!entryEl) {
    return;
  }

  const filename = entryEl.dataset.filename;
  if (!filename) {
    return;
  }

  const action = actionButton.dataset.action;
  const contentEl = entryEl.querySelector<HTMLDivElement>('.entry-content');
  const editorEl = entryEl.querySelector<HTMLDivElement>('.entry-editor');
  const editorInput = entryEl.querySelector<HTMLTextAreaElement>('.entry-editor-input');
  const editButton = entryEl.querySelector<HTMLButtonElement>('button[data-action="edit"]');
  const saveButton = entryEl.querySelector<HTMLButtonElement>('button[data-action="save"]');
  const cancelButton = entryEl.querySelector<HTMLButtonElement>('button[data-action="cancel"]');

  if (!contentEl || !editorEl || !editorInput || !editButton || !saveButton || !cancelButton) {
    return;
  }

  if (action === 'edit') {
    if (!entryEl.dataset.loaded) {
      try {
        const entry = await fetchJournalEntry(filename);
        editorInput.value = entry.content;
        entryEl.dataset.originalContent = entry.content;
        entryEl.dataset.loaded = 'true';
      } catch (error) {
        return;
      }
    }

    contentEl.hidden = true;
    editorEl.hidden = false;
    editButton.hidden = true;
    saveButton.hidden = false;
    cancelButton.hidden = false;
    editorInput.focus();
    return;
  }

  if (action === 'cancel') {
    const original = entryEl.dataset.originalContent ?? '';
    editorInput.value = original;
    editorEl.hidden = true;
    contentEl.hidden = false;
    editButton.hidden = false;
    saveButton.hidden = true;
    cancelButton.hidden = true;
    return;
  }

  if (action === 'save') {
    const updatedContent = editorInput.value.trim();
    if (!updatedContent) {
      showMessage('Please enter some content', 'error', 'journal-message');
      return;
    }

    try {
      const updatedEntry = await updateJournalEntry(filename, updatedContent);
      contentEl.innerHTML = updatedEntry.html;
      entryEl.dataset.originalContent = updatedEntry.content;
      editorEl.hidden = true;
      contentEl.hidden = false;
      editButton.hidden = false;
      saveButton.hidden = true;
      cancelButton.hidden = true;
      showMessage('Journal entry updated successfully!', 'success', 'journal-message');
    } catch (error) {
      // Error already shown in updateJournalEntry
    }
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
  journalList.addEventListener('click', handleJournalListClick);
}
