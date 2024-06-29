const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('dotenv').config();

async function loginLinkedIn(driver) {
    // Load LinkedIn credentials from environment variables
    const username = process.env.LINKEDIN_USERNAME;
    const password = process.env.LINKEDIN_PASSWORD;

    if (!username || !password) {
        console.error('LinkedIn username or password not set in environment variables.');
        return;
    }

    // Inject JavaScript to create a yellow circle at the mouse pointer
    const injectMouseCircleScript = `
        (function() {
            var circle = document.createElement('div');
            circle.id = 'mouse-circle';
            circle.style.width = '20px';
            circle.style.height = '20px';
            circle.style.borderRadius = '50%';
            circle.style.background = 'yellow';
            circle.style.position = 'absolute';
            circle.style.zIndex = '1000';
            circle.style.pointerEvents = 'none';
            document.body.appendChild(circle);

            document.addEventListener('click', function(e) {
                circle.style.left = (e.pageX - 10) + 'px';
                circle.style.top = (e.pageY - 10) + 'px';
                circle.style.display = 'block';
            });

            document.addEventListener('mousemove', function(e) {
                circle.style.left = (e.pageX - 10) + 'px';
                circle.style.top = (e.pageY - 10) + 'px';
            });

            circle.style.display = 'none';
        })();
    `;

    try {
        // Open LinkedIn login page
        await driver.get('https://www.linkedin.com/login');

        // Inject the script to add the yellow circle
        await driver.executeScript(injectMouseCircleScript);

        console.log("About to check if in signInWithEmail page");
        const signInWithEmail = await driver.findElement(By.xpath("/html/body/main/section[1]/div/div/a"));
        if (signInWithEmail){
            console.log("singInWithEmail - ",signInWithEmail);
            await signInWithEmail.click();
        }
        
        // Input username with delay
        await driver.findElement(By.id('username')).sendKeys(username);
        await driver.sleep(3000); // 1 second delay

        // Input password with delay
        await driver.findElement(By.id('password')).sendKeys(password);
        await driver.sleep(3000); // 1 second delay

        // Click the login button with delay
        await driver.findElement(By.xpath('//*[@type="submit"]')).click();
        await driver.sleep(4000); // 2 second delay

        // Wait until the home page loads
        await driver.wait(until.urlContains('feed'), 10000);

        console.log('Logged in successfully!');
    } catch (error) {
        console.error('Error logging in: ', error);
    }
}

module.exports = loginLinkedIn;
