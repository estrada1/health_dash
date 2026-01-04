import { initJournal } from './journal.js';
import { initWeights } from './weights.js';
import { initWorkouts } from './workouts.js';
document.addEventListener('DOMContentLoaded', async () => {
    await initWeights();
    await initWorkouts();
    await initJournal();
});
//# sourceMappingURL=app.js.map