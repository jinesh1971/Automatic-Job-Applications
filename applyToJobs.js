const { By, Key } = require('selenium-webdriver');
const fs = require('fs');
const { getChatCompletion } = require('./chatGptIntegration');
const { OpenAI } = require('openai');
require('dotenv').config();

// Load user profile
const userProfile = JSON.parse(fs.readFileSync('userProfile.json', 'utf8'));

// Dynamically set the API key without Configuration
const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

async function getAIResponse(question, profile) {
    const prompt = `Given the following user profile, answer the question appropriately:\n\nUser Profile: ${JSON.stringify(profile)}\n\nQuestion: ${question}\n\nAnswer:`;
    const response = await openai.createCompletion({
        model: 'gpt-3.5-turbo',
        prompt: prompt,
        max_tokens: 50,
    });
    return response.data.choices[0].text.trim();
}

async function applyToJobsWithEasyApply(driver) {
    try {
        await driver.sleep(4000);
        const jobListingsContainer = await driver.findElement(By.xpath("/html/body/div[5]/div[3]/div[4]/div/div/main/div/div[2]/div[1]/div/ul"));
        const jobListings = await jobListingsContainer.findElements(By.tagName('li'));

        console.log("Number of job listings found on page:", jobListings.length);

        for (let i = 0; i < jobListings.length; i++) {
            console.log("About to begin applying jobs, Wating 4 seconds");
            await driver.sleep(4000);
            try {
                await jobListings[i].click();
                console.log("About to click EasyApply button, Waiting 5 seconds");
                await driver.sleep(5000);
            
                const easyApplyButton = await driver.findElement(By.xpath("/html/body/div[5]/div[3]/div[4]/div/div/main/div/div[2]/div[2]/div/div[2]/div/div[1]/div/div[1]/div/div[1]/div[1]/div[6]/div/div/div/button"));
                if (easyApplyButton) {
                    await easyApplyButton.click();


                    //Handle pop up for job application
                    await handleApplyPopup(driver);

                    console.log("About to click review button, waiting 7 seconds");
                    await driver.sleep(7000);
                    const reviewButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/footer/div[2]/button[2]"));
                    reviewButton.click();

                    console.log("About to click submit button, waiting 2 seconds");
                    await driver.sleep(2000);

                    const submitApplicationButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/div/footer/div[3]/button[2]"));
                    submitApplicationButton.click();
                    const afterSubmitCrossButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/button"));
                    afterSubmitCrossButton.click();
                    console.log("Submit button found and clicked, moving on to the next job");
                    //While testing
                    // try{
                    //     const crossButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/button"));
                    //     crossButton.click();
                    //     console.log("cross button clicked");
                    // }
                    // catch (err){
                    //     console.log("Unable to click cross button, error - ", err)
                    // }                    

                    // await clickDismissButton(driver);

                    await driver.sleep(4000);
                    console.log("Before proceeding to apply next job, waiting 4 seconds.");

                } 
            } catch (err) {
                console.log('No Easy Apply button or error applying:', err);
            }
        }
    } catch (error) {
        console.error('Error applying to jobs with Easy Apply:', error);
    }
}

async function isValidQuestion(text) {
    // Add logic to determine if the text is a valid question
    // For example, check if the text is not too short and doesn't consist of common invalid texts
    var returnValue =  text.length > 5 && !['Yes', 'No', 'Select an option'].includes(text);
    return returnValue;
}


async function clickDismissButton(driver) {
    try {
        // First attempt using CSS selector with data-control-name attribute
        const dismissButton = await driver.findElement(By.css('button.artdeco-button--secondary[data-control-name="discard_application_confirm_btn"]'));
        await dismissButton.click();
        console.log("Dismiss button clicked using first strategy (CSS selector with data-control-name).");
    } catch (error) {
        console.log("First strategy failed, trying second strategy (XPath with data-control-name).", error);
        try {
            // Second attempt using XPath with data-control-name attribute
            const dismissButton = await driver.findElement(By.xpath("//button[@data-control-name='discard_application_confirm_btn']"));
            await dismissButton.click();
            console.log("Dismiss button clicked using second strategy (XPath with data-control-name).");
        } catch (error) {
            console.log("Second strategy failed, trying third strategy (XPath with button text).", error);
            try {
                // Third attempt using XPath with button text
                const dismissButton = await driver.findElement(By.xpath("//button//span[text()='Discard']"));
                await dismissButton.click();
                console.log("Dismiss button clicked using third strategy (XPath with button text).");
            } catch (error) {
                console.log("Third strategy failed, trying fourth strategy (id attribute).", error);
                try {
                    // Fourth attempt using id attribute
                    const dismissButton = await driver.findElement(By.id('ember769'));
                    await dismissButton.click();
                    console.log("Dismiss button clicked using fourth strategy (id attribute).");
                } catch (error) {
                    console.log("All strategies failed to locate the dismiss button.", error);
                }
            }
        }
    }
}


async function handleRadioInput(question, questionText) {
    try {
        // Find the radio button with the desired value and click it
        const answer = await getChatCompletion("Please answer Yes or No: " + questionText);
        console.log("Radio input - Question:", questionText, " Answer:", answer);
        const radioButton = await question.findElement(By.css(`input[value='${answer}']`));
        await clickElement(radioButton); // Click the radio button using the clickElement function
    } catch (error) {
        console.error("Error handling radio input:", error);
    }
}

async function handleTextInput(question, questionText) {
    try {
        // Find the text input and send keys to it
        const answer = await getChatCompletion(questionText);
        console.log("Text input - Question:", questionText, " Answer:", answer);
        const textInput = await question.findElement(By.css("input[type='text']"));
        await textInput.sendKeys(answer);
    } catch (error) {
        console.error("Error handling text input:", error);
    }
}

async function clickElement(element) {
    try {
        await element.click();
    } catch (error) {
        console.log("First attempt failed! Attempting to click using JavaScript executor.");
        try {
            await driver.executeScript("arguments[0].click();", element);
        } catch (error) {
            console.error("Both attempts failed. Could not click element:", error);
            throw error; // Re-throw the error to handle it in the calling function
        }
    }
}

async function handleApplyPopup(driver) {
    try {
        const mobileNumberInput = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/div/div/div[4]/div/div/div[1]/div/input"));
        await mobileNumberInput.clear();
        await mobileNumberInput.sendKeys(process.env.MOBILE_NUMBER, Key.RETURN);

        console.log('Mobile number entered.');

        const nextButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/footer/div[2]/button"));
        await nextButton.click();
        console.log('Next button clicked, waiting for 4 seconds');

        await driver.sleep(4000);

        // If upload resume, then upload resume.
        console.log('Process upload resume began');
        const uploadResumeInput = await driver.findElement(By.xpath("//input[@type='file' and contains(@id, 'jobs-document-upload-file-input-upload-resume')]"));
        console.log("Uploading resume...wait 3 seconds");
        await driver.sleep(3000);
        await driver.executeScript('arguments[0].style.display = "block";', uploadResumeInput); // Make the input visible if needed
        await uploadResumeInput.sendKeys('/Users/jineshmodi/Downloads/testResume.pdf');
        console.log("Resume uploaded");
        await driver.sleep(3000);

        const nextButtonAfterResume = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/footer/div[2]/button[2]"));
        await nextButtonAfterResume.click();

        //Get questions
        const questions = await driver.findElements(By.css(".fb-dash-form-element"));
        for (let question of questions) {
            let questionText = '';
            try {
                // Try to find question text in different possible elements
                const label = await question.findElement(By.css("label"));
                questionText = await label.getText();
                
                if (!(await isValidQuestion(questionText))){
                    console.log("Invalid")
                    throw new Error("Invalid question text in label");
                }
            } catch (e) {
                try {
                    console.log("entered second attempt");
                    const legend = await question.findElement(By.css("legend"));
                    questionText = await legend.getText();
                    if (!(await isValidQuestion(questionText))) throw new Error("Invalid question text in legend");
                } catch (e) {
                    try {
                        const span = await question.findElement(By.css(".fb-dash-form-element__label span[aria-hidden='true']"));
                        questionText = await span.getText();
                        if (!(await isValidQuestion(questionText))) throw new Error("Invalid question text in span");
                    } catch (e) {
                        console.log("Unable to find valid question text for this element.");
                        continue;
                    }
                }
            }         
        
            const selectElements = await question.findElements(By.css("select"));            
            if (selectElements.length>0){
                const dropdown = selectElements[0];
                
                // Get all available options
                const options = await dropdown.findElements(By.css("option"));
                let optionsText = [];
                for (let option of options) {
                    const text = await option.getText();
                    if (!(text === "Select an option"))
                    {
                        optionsText.push(text);
                    }
                }

                 // Prepare the question for ChatGPT
                 const questionWithOptions = `which of the following options is the most suitable? Options: ${optionsText.join(', ')}`;
                 console.log("sending question: ",questionWithOptions)
                 
                 // Get the best option from ChatGPT
                 const bestOption = await getChatCompletion(questionWithOptions);
                 console.log("best option - ",bestOption);
                 
                 // Select the best option by its visible text
                 for (let option of options) {
                  const text = await option.getText();
                  if (text === bestOption) {
                        await option.click();
                        break;
                   }
                 }
            }
            else
            {
                console.log("-----Checking input");
                // Check if the input is a radio button or a text input
                const inputType = await question.findElement(By.css("input")).getAttribute("type");
                console.log("input type - ",inputType)
                if (inputType === 'radio') {
                    // // Find the radio button with the desired value and click it
                    // const answer  = await getChatCompletion("Please answer Yes or No: "+questionText);   
                    // console.log("Radio input - Question - ",questionText," answer - ",answer);
                    // const radioButton = await question.findElement(By.css(`input[value='${answer}']`));
                    // console.log("question - ",question);
                    // console.log("radioButton - ",radioButton);
                    // try{
                    //     await radioButton.click();
                    // }catch(error)
                    // {
                    //     console.log("first attempt failed! second attempt clicking radio button, for question - ",questionText, " received error - ",error);
                    //     try{
                    //         await driver.executeScript("arguments[0].click();", radioButton);
                    //     }catch(error){
                    //         console.log("second attempt failed with question - ",questionText," with error - ",error);
                    //     }
                    // }
                    handleRadioInput(question, questionText);
                } else if (inputType === 'text') {
                    // // Find the text input and send keys to it
                    // const answer  = await getChatCompletion(questionText);   
                    // console.log("Text input - Question - ",questionText," answer - ",answer);
                    // const textInput = await question.findElement(By.css("input[type='text']"));
                    // await textInput.sendKeys(answer);
                    handleTextInput(question, questionText);

                } else {
                    console.log("Unsupported input type: ", inputType);
                }  
            }
        }
        console.log("All questions answered");
      
    } catch (error) {
        console.error('Error handling apply popup:', error);
    }
}

module.exports = {
    applyToJobsWithEasyApply
};
