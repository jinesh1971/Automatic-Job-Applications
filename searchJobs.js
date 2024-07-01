const fs = require('fs');
const { Builder, By, Key, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();
const { applyToJobsWithEasyApply } = require('./applyToJobs'); // Correct path to applyToJobs.js

const PROFILE_DIR = 'chrome-profile';
const USE_PERSISTENT_LOGIN = process.env.USE_PERSISTENT_LOGIN === 'true';
const START_FROM_RESUME_UPLOAD = process.env.START_FROM_RESUME_UPLOAD === 'true';
const JOB_LISTINGS_URL_FILE = 'jobListingsUrl.txt';

async function loginAndSearchJobs() {
    let driver;

    try {
        // Set Chrome options
        let options = new chrome.Options();
        options.addArguments('disable-default-apps');
        options.addArguments('no-default-browser-check');
        options.addArguments('disable-popup-blocking');
        options.addArguments('disable-extensions');
        options.addArguments('start-maximized');
        options.addArguments('--disable-notifications');
        options.addArguments('--disable-plugins');
        options.addArguments('--disable-infobars');
        options.addArguments('--disable-blink-features=AutomationControlled');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-gpu');
        options.addArguments('--verbose');
        // options.addArguments('--headless');
        
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments('--log-path=chrome_debug.log');
        options.addArguments('--window-size=1920,1080');
        options.setChromeBinaryPath('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');

        options.setUserPreferences({ credential_enable_service: false });

        if (USE_PERSISTENT_LOGIN) {
            if (!fs.existsSync(PROFILE_DIR)) {
                fs.mkdirSync(PROFILE_DIR);
            }
            options.addArguments(`--user-data-dir=${PROFILE_DIR}`);
        }

        // Initialize the WebDriver
        driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .build();


        console.log("START_FROM_RESUME_UPLOAD - ",START_FROM_RESUME_UPLOAD);
        if (START_FROM_RESUME_UPLOAD) {
            // Load the filtered job listings URL from the file
            const jobListingsUrl = fs.readFileSync(JOB_LISTINGS_URL_FILE, 'utf8');
            await driver.get(jobListingsUrl);
            console.log('Navigated directly to job listings page with filters applied.');
        } else {
            // Load LinkedIn
            console.log('Loading LinkedIn...');
            await driver.get('https://www.linkedin.com/');

            console.log("Checking if user is logged in...");
            // Check if already logged in
            if (await isLoggedIn(driver)) {
                console.log('User is already logged in.');
            } else {
                console.log('Logging into LinkedIn...');

                // Wait for the username input field to be located
                await driver.wait(until.elementLocated(By.name('session_key')), 15000); // Increase timeout if necessary
                // Enter username and password
                await driver.findElement(By.name('session_key')).sendKeys(process.env.LINKEDIN_USERNAME);
                await driver.findElement(By.name('session_password')).sendKeys(process.env.LINKEDIN_PASSWORD, Key.RETURN);

                // Wait for the page to load after login
                await driver.wait(until.titleContains('LinkedIn'), 15000); // Increase timeout if necessary
                console.log('Login successful');
            }

            // Proceed with job search and other actions
            await performJobSearch(driver);

            // Applying to jobs with Easy Apply or other logic
            await applyToJobsWithEasyApply(driver);
        }
        
        // Applying to jobs with Easy Apply or other logic
        await applyToJobsWithEasyApply(driver);
        // Wait for 60 seconds before closing the browser
        console.log('Actions completed. Leaving page open for 60 seconds...');
        await driver.sleep(60000);

    } catch (error) {
        console.error('Error in loginAndSearchJobs:', error);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('Browser closed after 60 seconds.');
        }
    }
}

async function performJobSearch(driver) {
    // Perform job search for Software Engineer in Canada
    console.log('Performing job search...');
    await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='Search']")), 10000);
    await driver.findElement(By.xpath("//input[@placeholder='Search']")).sendKeys('Software Engineer', Key.ENTER);
    await driver.sleep(5000);
    console.log('Job title search complete');

    // Click on "See all job results in Canada" link if available
    try {
        await driver.wait(until.elementLocated(By.partialLinkText('See all job results in Canada')), 10000);
        const seeAllJobsLink = await driver.findElement(By.partialLinkText('See all job results in Canada'));
        await seeAllJobsLink.click();
        await driver.sleep(5000);
        console.log('Clicked "See all job results in Canada"');
    } catch (error) {
        console.error('Error clicking "See all job results in Canada":', error);
    }

    // Click on "All filters" button if available
    try {
        await driver.wait(until.elementLocated(By.xpath("//button[text()='All filters']")), 10000);
        const allFiltersButton = await driver.findElement(By.xpath("//button[text()='All filters']"));
        await allFiltersButton.click();
        await driver.sleep(2000);
        console.log('Clicked "All filters"');

        // Scroll to "Job type" section under "All filters"
        await scrollToElement(driver, By.xpath("//h3[text()='Job type']"));
        await driver.sleep(1000);
        console.log('Scrolled to "Job type" section');

        // Select "Contract" checkbox under "Job type" if available
        const contractCheckbox = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/ul/li[6]/fieldset/div/ul/li[3]/label/p/span[1]"));
        await contractCheckbox.click();
        await driver.sleep(1000);
        console.log('Filter "Contract" added');

        // Scroll to "Remote" section under "All filters"
        await scrollToElement(driver, By.xpath("//h3[text()='Remote']"));
        await driver.sleep(1000);
        console.log('Scrolled to "Remote" section');

        // Select "Remote" checkbox under "Remote" if available
        const remoteCheckbox = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/ul/li[7]/fieldset/div/ul/li[3]/label/p/span[1]"));
        await remoteCheckbox.click();
        await driver.sleep(1000);
        console.log('Filter "Remote" added');

        // Select "Easy Apply" if available
        const easyApplyToggle = await driver.findElement(By.xpath("/html/body/div[3]/div/div/div[2]/ul/li[8]/fieldset/div"));
        await easyApplyToggle.click();
        await driver.sleep(1000);
        console.log('Easy apply toggle enabled');

        

    } catch (error) {
        console.error('Error clicking "All filters" or scrolling:', error);
    }

    // Click on "Show results"
    try {
        const seeResults = await driver.findElement(By.xpath('/html/body/div[3]/div/div/div[3]/div/button[2]'));
        await seeResults.click();
        await driver.sleep(5000);
        console.log('Clicked "See Results"');

        // Save the current URL (filtered job listings) to a file
        const jobListingsUrl = await driver.getCurrentUrl();
        fs.writeFileSync(JOB_LISTINGS_URL_FILE, jobListingsUrl, 'utf8');
        console.log('Saved filtered job listings URL:', jobListingsUrl);

    } catch (error) {
        console.error('Error clicking "See Results":', error);
    }
}

// async function isLoggedIn(driver) {
//     try {
//         // Check if the profile icon or any element unique to a logged-in session is present
//         const loggedIn = await driver.findElement(By.xpath("/html/body/div[5]/header/div/nav/ul/li[6]/div/button"));
//         return !!loggedIn;
//     } catch (error) {
//         console.log("---------returning error while checking ifLoggedIn",error)
//         return false;
//     }
// }
async function isLoggedIn(driver) {
    try {
        // Use an explicit wait to wait for the presence of the profile icon or any unique element
        const loggedIn = await driver.wait(
            until.elementLocated(By.xpath("/html/body/div[5]/header/div/nav/ul/li[6]/div/button")),
            10000 // Wait for up to 10 seconds
        );
        return !!loggedIn;
    } catch (error) {
        console.log("---------Error while checking ifLoggedIn:", error);
        return false;
    }
}

async function scrollToElement(driver, locator) {
    const element = await driver.findElement(locator);
    await driver.executeScript('arguments[0].scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });', element);
}

module.exports = {
    loginAndSearchJobs
};

