const { By, Key, until} = require('selenium-webdriver');
const fs = require('fs');
const { getChatCompletion } = require('./chatGptIntegration');
const { OpenAI } = require('openai');
require('dotenv').config();

const JOB_COUNTER = 0;
const JOB_LISTINGS_NOT_APPLIED = 'job_listings_not_applied.txt';
var NEED_REFRESH = false;

// Load user profile
// const userProfile = JSON.parse(fs.readFileSync('userProfile.json', 'utf8'));

// // Dynamically set the API key without Configuration
// const openai = new OpenAI({ key: process.env.OPENAI_API_KEY });

// async function getAIResponse(question, profile) {
//     const prompt = `Given the following user profile, answer the question appropriately:\n\nUser Profile: ${JSON.stringify(profile)}\n\nQuestion: ${question}\n\nAnswer:`;
//     const response = await openai.createCompletion({
//         model: 'gpt-3.5-turbo',
//         prompt: prompt,
//         max_tokens: 50,
//     });
//     return response.data.choices[0].text.trim();
// }

// Function to append URL to the file
async function saveUrlToFile(url) {
    return new Promise((resolve, reject) => {
        fs.appendFile(JOB_LISTINGS_NOT_APPLIED, `${url}\n`, (err) => {
            if (err) reject(err);
            resolve();
        });
    });
}

async function applyToJobsWithEasyApply(driver) {
    try {
        await driver.sleep(4000);
        // const jobListingsContainer = await driver.findElement(By.xpath("/html/body/div[5]/div[3]/div[4]/div/div/main/div/div[2]/div[1]/div/ul"));
        // const jobListings = await jobListingsContainer.findElements(By.tagName('li'));
        let jobListings = await driver.findElements(By.css('li.jobs-search-results__list-item'));

        console.log("Number of job listings found on page:", jobListings.length);

        for (let i = 0; i < jobListings.length; i++) {
            // Re-fetch the job listings before interacting to avoid stale element reference
            jobListings = await driver.findElements(By.css('li.jobs-search-results__list-item'));

            console.log("\nAbout to begin applying jobs, Wating 4 seconds");
            await driver.sleep(4000);
            try {
                await jobListings[i+JOB_COUNTER].click();
                let jobTitleElement;
                
                try{
                    jobTitleElement = await jobListings[i+JOB_COUNTER].findElement(By.css('a.job-card-list__title'));
                    console.log("Waiting 5 seconds, i - ",i+JOB_COUNTER," Job title - ",await jobTitleElement.getText());
                    await driver.sleep(5000);
                }catch(err){
                    console.log("Unable to get the job title , error - ",err);
                    console.log("");
                }
            
                let easyApplyButton;

                try {
                    await driver.wait(until.elementLocated(By.xpath("//button[contains(@aria-label, 'Easy Apply to')]")), 10000);
                     easyApplyButton = await driver.findElement(By.xpath("//button[contains(@aria-label, 'Easy Apply to')]"));

                } catch (error) {
                    console.log("Job either applied or Easy button not available, Continuing with the next job. Waiting 2 seconds");
                    await driver.sleep(2000);
                    // Continue with the next job...
                }
                
                if (easyApplyButton){
                    await easyApplyButton.click();
                    console.log("Easy Apply button clicked.");
            
                    //Handle pop up for job application
                    await handleApplyPopup(driver);
                    
                    if (NEED_REFRESH){
                        // Refresh the browser
                        await driver.navigate().refresh();
                        NEED_REFRESH = false;
                    }

                    console.log("About to click review button, waiting 7 seconds");

                    let reviewButton;
                    try {
                        reviewButton = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/footer/div[2]/button[2]"));
                        await reviewButton.click();
                        console.log("Review button clicked, waiting 2 seconds");
                        await driver.sleep(2000);
                    } catch (err) {
                        console.log("Review button not found, skipping to submit button, error - ",err);
                    }

                    console.log("About to click submit button, waiting 2 seconds");
                    await driver.sleep(2000);

                  
                    try {
                        const locators = [
                            By.xpath("//button[@aria-label='Submit application' and contains(@class, 'artdeco-button--primary')]"),
                            By.xpath("//button[normalize-space() = 'Submit application']"),
                            // By.css(".artdeco-button.artdeco-button--2.artdeco-button--primary"),
                            By.xpath("//button[./span[text()='Submit application']]"),
                            By.id("ember928")
                        ];

                        let elementFound = false;
                        console.log("Running through locators");
                        for (let locator of locators) {
                            try {                            
                                const submitButton = await driver.findElement(locator);
                                console.log("locator - ", locator);
                                await submitButton.click();
                                elementFound = true;
                                break; // Exit the loop if the element is found and clicked
                            } catch (e) {
                                // Continue to the next locator if this one fails
                            }
                        }
                        if (!elementFound) {
                            throw new Error("Failed to locate and click the submit button using all provided strategies.");
                        }
                    } catch (e) {
                        console.error("error during submit button event",e);
                    }
                    
                    console.log("Submit button clicked, now going to click the afterSubmitCrossButton, waiting 3 seconds");
                    await driver.sleep(3000);
                    try {//ID, CSS selector, aria-label, class name, descendant XPath
                        await afterSubmitCrossButton(driver,"ember464",".artdeco-modal__dismiss.artdeco-button--circle", "Dismiss", "artdeco-modal__dismiss", "//button[./svg[@data-test-icon='close-medium']]" );
                        console.log("Cross after submit button clicked successfully");
                    } catch(e) {
                        console.log("error during clicking submitCrossButton- ",e)
                    }

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
                    console.log("Before proceeding to apply next job, waiting 4 seconds.");
                    await driver.sleep(4000);
                } 
            } catch (err) {
                console.log('Error while applying jobs', err);
            }
        }
    } catch (error) {
        console.error('Error applying to jobs, in function  applyToJobsWithEasyApply', error);
    }
}

async function isValidQuestion(text) {
    // Add logic to determine if the text is a valid question
    // For example, check if the text is not too short and doesn't consist of common invalid texts
    var returnValue =  text.length > 5 && !['Yes', 'No', 'Select an option'].includes(text);
    return returnValue;
}

async function handleMobileInput(driver) {
    const locators = [
        By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/div/div/div[4]/div/div/div[1]/div/input"), // Original XPath
        By.css("input[id*='phoneNumber-nationalNumber']"), // CSS selector using ID partial match
        By.css("input[type='text'][required]"), // CSS selector using type and required attributes
        By.xpath("//input[contains(@id, 'phoneNumber-nationalNumber')]"), // XPath using ID partial match
        By.xpath("//input[@type='text' and @required]") // XPath using type and required attributes
    ];

    let elementFound = false;
    let element;

    for (let locator of locators) {
        try {
            await driver.wait(until.elementLocated(locator), 5000); // Wait for the element to be located
            element = await driver.findElement(locator);
            elementFound = true;
            break; // Exit the loop if the element is found
        } catch (e) {
            // Continue to the next locator if this one fails
        }
    }

    if (!elementFound) {
        throw new Error("Failed to locate the mobile number input using all provided strategies.");
    }

    // Re-locate the element before interacting with it to avoid stale element reference error
    try {
        await driver.wait(until.elementLocated(By.id("single-line-text-form-component-formElement-urn-li-jobs-applyformcommon-easyApplyFormElement-3941374859-751046301-phoneNumber-nationalNumber")), 5000);
        element = await driver.findElement(By.id("single-line-text-form-component-formElement-urn-li-jobs-applyformcommon-easyApplyFormElement-3941374859-751046301-phoneNumber-nationalNumber"));
    } catch (e) {
        // If re-locating by ID fails, continue to the next locators
        for (let locator of locators) {
            try {
                await driver.wait(until.elementLocated(locator), 5000);
                element = await driver.findElement(locator);
                break;
            } catch (e) {
                // Continue to the next locator if this one fails
            }
        }
    }
    await element.clear();
    await element.sendKeys(process.env.MOBILE_NUMBER, Key.RETURN);
    console.log("Mobile number entered successfully");
}

async function afterSubmitCrossButton(driver, id, cssSelector, ariaLabel, className, descendantXPath) {
    let element;

    try {
        // Attempt using ID
        element = await driver.findElement(By.id(id));
    } catch (e) {
        try {
            console.log("Second attempt, trying to find element with css selector");
            // Attempt using CSS selector
            element = await driver.findElement(By.css(cssSelector));
        } catch (e) {
            try {
                console.log("Third attempt, trying to find element with xpath aria-label");
                // Attempt using XPath with aria-label
                element = await driver.findElement(By.xpath(`//button[@aria-label='${ariaLabel}']`));
            } catch (e) {
                try {
                    console.log("fourth attempt, trying to find element with xpath aria-label and class");

                    // Attempt using more specific XPath with aria-label and class
                    element = await driver.findElement(By.xpath(`//button[@aria-label='${ariaLabel}' and contains(@class, '${className}')]`));
                } catch (e) {
                    try {
                        console.log("fifth attempt, trying to find element with xpath descendant elements");

                        // Attempt using XPath with descendant elements
                        element = await driver.findElement(By.xpath(descendantXPath));
                    } catch (e) {
                        throw new Error("Failed to locate the element using all provided strategies.");
                    }
                }
            }
        }
    }
    // Re-locate the element before clicking to avoid stale element reference error
    try {
        await driver.wait(until.elementLocated(By.id(id)), 5000);
        element = await driver.findElement(By.id(id));
    } catch (e) {
        try {
            await driver.wait(until.elementLocated(By.css(cssSelector)), 5000);
            element = await driver.findElement(By.css(cssSelector));
        } catch (e) {
            try {
                await driver.wait(until.elementLocated(By.xpath(`//button[@aria-label='${ariaLabel}']`)), 5000);
                element = await driver.findElement(By.xpath(`//button[@aria-label='${ariaLabel}']`));
            } catch (e) {
                try {
                    await driver.wait(until.elementLocated(By.xpath(`//button[@aria-label='${ariaLabel}' and contains(@class, '${className}')]`)), 5000);
                    element = await driver.findElement(By.xpath(`//button[@aria-label='${ariaLabel}' and contains(@class, '${className}')]`));
                } catch (e) {
                    await driver.wait(until.elementLocated(By.xpath(descendantXPath)), 5000);
                    element = await driver.findElement(By.xpath(descendantXPath));
                }
            }
        }
    }

    await element.click();
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


// async function handleRadioInput(question, questionText) {
//     try {
//         console.log("inside handleRadioInput, about to get answer from chatgpt")
//         console.log("questionText - ",questionText)
//         // Find the radio button with the desired value and click it
//         const answer = await getChatCompletion("Please answer Yes or No: " + questionText);
//         console.log("Radio input - Question:", questionText, " Answer:", answer);
//         const radioButton = await question.findElement(By.css(`input[value='${answer}']`));
//         await clickElement(radioButton); // Click the radio button using the clickElement function
//     } catch (error) {
//         console.error("Error handling radio input:", error);
//     }
// }

async function handleTextInput(question, questionText, driver) {
    try {
        // Find the text input and send keys to it
        const answer = await getChatCompletion(questionText);
        console.log("Text input - Question:", questionText, " Answer:", answer);
        const textInput = await question.findElement(By.css("input[type='text']"));
        //remove any text from the input field
        textInput.clear();
        await driver.sleep(1000);
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
        
        console.log("trying to get mobile number element, wait 2 seconds");
        await driver.sleep(2000);
        try {
            await handleMobileInput(driver);
        } catch (e) {
            console.error("Error handling apply popup:", e);
        } 

        console.log('Waiting 2 second');
        await driver.sleep(2000);
        
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
        await uploadResumeInput.sendKeys(process.env.RESUME_PATH_NAME);
        console.log("Resume uploaded");
        await driver.sleep(3000);

        const nextButtonAfterResume = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/div/div[2]/form/footer/div[2]/button[2]"));
        await nextButtonAfterResume.click();

        //Get questions
        const questions = await driver.findElements(By.css(".fb-dash-form-element"));
        for (let question of questions) {
            console.log("Answering questions... wait 2 seconds");
            await driver.sleep(2000);
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
                        const currentUrl = await driver.getCurrentUrl();
                        await saveUrlToFile(currentUrl);
                        console.log(`URL saved in file ${JOB_LISTINGS_NOT_APPLIED} : URL -  ${currentUrl}`);
                        NEED_REFRESH = true;
                        return;
                    }
                }
            }         
        
            const selectElements = await question.findElements(By.css("select"));            
            if (selectElements.length>0){
                console.log("Input type - Select! Question - ",questionText);
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
                 const questionWithOptions = `Question - ${questionText} | which of the following options is the most suitable ? Options: ${optionsText.join(', ')}`;
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
                console.log("\n\n-----Checking input type");
                // Check if the input is a radio button or a text input
                const inputType = await question.findElement(By.css("input")).getAttribute("type");
                console.log("Input type - ",inputType)
                
                if (inputType === 'radio') {
                
                    // Find the radio button with the desired value and click it
                    const answer  = await getChatCompletion("Please answer Yes or No: "+questionText);   
                    console.log("\nRadio input - Question - ",questionText," answer - ",answer);
                    const radioButton = await question.findElement(By.css(`input[value='${answer}']`));
                
                    console.log("About to click radio button")
                    try{
                        await radioButton.click();
                    }catch(error)
                    {
                        console.log("first attempt failed! second attempt clicking radio button, for question - ",questionText, " received error - ",error);
                        try{
                            await driver.executeScript("arguments[0].click();", radioButton);
                        }catch(error){
                            console.log("second attempt failed with question - ",questionText," with error - ",error);
                        }
                    }

                } else if (inputType === 'text') {
                    // // Find the text input and send keys to it
                    // const answer  = await getChatCompletion(questionText);   
                    // console.log("Text input - Question - ",questionText," answer - ",answer);
                    // const textInput = await question.findElement(By.css("input[type='text']"));
                    // await textInput.sendKeys(answer);
                    await handleTextInput(question, questionText, driver);

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
