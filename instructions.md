I want to write a chrome extension that will help me write email responses to an email thread in gmail.

I want the the following functionality:

## Functionality 1:
1. Open up a gmail thread
2. I can trigger a UI to open up
3. The chrome extension will read the email chain. It will make sure to understand the people involved in the email thread, understand who I am (as the owner of the gmail account). There may be some other details to gather from the email thread as well
4. The UI will give me a 3-5 possible response categories to the email thread. (You can use an LLM for this. I have Claude PRO). I can also add my own instructions for what I want to be said in the response
5. I click submit
6. A few responses will be generated via an LLM (I have Claude Pro)
7. I can make tweaks to generated email response

## Functionality 2:
I want to be able to specify some settings about the chrome extension, including:
- example emails that I've written in the past. This will be used in Functionality 1 step 4 so that the drafted emails sound like me. I should be able to add indefinite number of sample emails here, but I will probably only have 10-20 emails as an example
- Specify arbitrary other details about me. my phone number, email, full name, address, calendly link. I could also specify some other attribute about me that I should be able to add.
- Specify LLM details. I currently have a Claude account, but I should be able to specify which LLM I am using and the associated API Key/Auth mechanism to be able to plug it in

Some functional details:
In the UI in functionality 1, I should be able to click a settings button, that can take me to Functionality 2 where I can reconfigure settings


