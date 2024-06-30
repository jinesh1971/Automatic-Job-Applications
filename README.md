# Automatic-Job-Applications
App to automatically apply to jobs on linkden

**Versions**
Node - v20.11.1
ChromeDriver - 126.0.6478.126
selenium-webdriver - 4.22.0

**Verify versions:**
node --version
chromedriver --version
npm list selenium-webdriver

**Files you need to modify:**
1. **UserProfile.json**
Here you can add your entire profile, as brief as possible. Under experience, you can add all the details you need. Modify as needed;

2. **.env**
  I. This file contains login details for your linkden profile, and openAI api key.
  II. You can use the same API KEY, as it is already paid for. If you try to create a new one, to have api calls, they will want to charge you, For a rough idea, I paid some 7$ for 1 million api calls, inbound and outbound.
 III. When testing out, if you don't want to go through login and process of search jobs again and again, set START_FROM_RESUME_UPLOAD = true in this file. It will start directly from the job search page with the filters applied.

Don't share this with anyone, as this ChatGPT API key is linked to my personal account, and can be misused if it gets on the dark web.

In Downloads folder, keep a resume named: "testResume.pdf"

**HOW TO RUN?**
Once all above settings have been understood, in terminal, run this:
node start.js

Sit back and enjoy the show!


