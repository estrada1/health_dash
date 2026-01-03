let weightChart = null;

// Fetch all weight entries from the API
async function fetchWeights() {
    try {
        const response = await fetch('/api/weights');
        if (!response.ok) {
            throw new Error('Failed to fetch weights');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching weights:', error);
        showMessage('Error loading weight data', 'error');
        return [];
    }
}

// Submit a new weight entry
async function submitWeight(weight) {
    try {
        const response = await fetch('/api/weights', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ weight: parseFloat(weight) }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to submit weight');
        }

        return await response.json();
    } catch (error) {
        console.error('Error submitting weight:', error);
        showMessage(error.message, 'error');
        throw error;
    }
}

// Format date for display
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

// Initialize or update the chart
function renderChart(data) {
    const ctx = document.getElementById('weight-chart').getContext('2d');

    // Prepare data for chart as x,y coordinates with actual timestamps
    const chartData = data.map(entry => ({
        x: new Date(entry.timestamp),
        y: entry.weight
    }));

    // Destroy existing chart if it exists
    if (weightChart) {
        weightChart.destroy();
    }

    // Create new chart
    weightChart = new Chart(ctx, {
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
    });
}

// Update chart with fresh data
async function updateChart() {
    const data = await fetchWeights();
    renderChart(data);
}

// Show message to user
function showMessage(text, type = 'success') {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    // Hide message after 3 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 3000);
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();

    const weightInput = document.getElementById('weight-input');
    const weight = weightInput.value;

    if (!weight || parseFloat(weight) <= 0) {
        showMessage('Please enter a valid weight', 'error');
        return;
    }

    try {
        await submitWeight(weight);
        showMessage('Weight entry added successfully!', 'success');
        weightInput.value = '';
        weightInput.focus();
        await updateChart();
    } catch (error) {
        // Error already shown in submitWeight function
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load and render initial chart
    await updateChart();

    // Set up form submission handler
    const form = document.getElementById('weight-form');
    form.addEventListener('submit', handleFormSubmit);
});
