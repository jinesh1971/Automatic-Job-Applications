const { loginAndSearchJobs } = require('./searchJobs');

async function start() {
    try {
        await loginAndSearchJobs();
    } catch (error) {
        console.error('Error in start:', error);
    }
}

start();
