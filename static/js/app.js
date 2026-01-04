import { initDiet } from './diet.js';
import { initJournal } from './journal.js';
import { initWeights } from './weights.js';
import { initWorkouts } from './workouts.js';
document.addEventListener('DOMContentLoaded', async () => {
    await initWeights();
    await initWorkouts();
    await initJournal();
    await initDiet();
});
//# sourceMappingURL=app.js.map