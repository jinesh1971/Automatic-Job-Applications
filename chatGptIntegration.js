// Import necessary packages
const { OpenAI } = require('openai');
const fs = require('fs');


const userProfile = JSON.parse(fs.readFileSync('userProfile.json', 'utf8'));

// Initialize OpenAI client with your API key
const openai = new OpenAI({
    apiKey: process.env.API_KEY,        // Replace with your actual API key
    organization: process.env.ORG_KEY,  // Replace with your organization ID
    project: process.env.PROJ_KEY       // Replace with your project ID
});

// Function to fetch a chat completion
async function getChatCompletion(q) {
    // const q = 'What is the experience?'
    const question = `Given the following user profile, answer the question appropriately (If a number such as years is asked, only provide a number please). If unable to determine the answer from the profile, then if number is asked, return 0. if text is asked, return no such experience \n\nUser Profile: ${JSON.stringify(userProfile)}\n\nQuestion: ${q}\n\nAnswer:`;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: question }],
            temperature: 0.7
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Call the function to fetch chat completion
module.exports = { getChatCompletion };

