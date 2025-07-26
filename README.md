# BiasBuster – Write Fair, Write Aware
## Inspiration:
While reading job posts, bios, and messages, we noticed that certain words like “rockstar,” “young,” or “aggressive” are commonly used but can make some people feel excluded based on gender, age, or tone.
These words aren’t always meant to harm, but they can still send the wrong message.
We wanted to build a tool that helps people become more aware of how their words may sound and helps them write in a way that’s fair, respectful, and inclusive.
That’s how **BiasBuster** was born:
- A simple, smart tool to help everyone **Write Fair, Write Aware.**

## Key features
**BiasBuster** helps you :
- Paste any text (like job posts, messages, etc.)
- Find biased or exclusive words
- Learn why the word might be a problem
- Get better word suggestions
- See a score showing how inclusive your text is
- provides the history of the user
- It’s fast, simple, and works in your browser

## Development Workflow
- **Backend**: Python and Flask
- **NLP**: Used spaCy to process the text
- **Logic**: We made our own list of biased words and grouped them (gender, age, tone)
- **Frontend**: HTML, CSS, and JavaScript
- **Scoring**: We give a score out of 10 based on how inclusive the text is
- Everything runs locally no need for big AI models or internet access.

## Key Struggles
- Some words are only biased in certain contexts
- We had to make the tool helpful without being too critical
- Keeping everything simple and quick for users
- **False positives**: Some words can be biased in one context and harmless in another (e.g., "dominant" in sports vs leadership)
- **UX clarity**: Displaying feedback without shaming users or overwhelming them was important. We focused on tone-friendly tooltips and color-coded highlights.

## Milestones Achieved
- A project that’s easy to deploy, open-source, and accessible to non-tech users
- No external tools or paid services needed
- Helps users learn and improve their writing
- Built in just few days from scratch
- Functional NLP analysis without training any models or relying on APIs
- Designing a tool that makes people reflect on language and inclusivity

## Insights Gained
- How to use NLP with spaCy
- How to detect bias in real-world writing
- How to design simple tools that solve real problems
- That small tools can make a big difference
- How to build AI tools that are ethical, practical, and helpful
- The power of a good user experience even the best AI fails if people don’t enjoy using it

## Upcoming Features & Improvements
- Add more words and bias types
- Let people upload resumes or job descriptions
- Build a browser extension
- Expand to multilingual support
- Add a shareable report or PDF output
- Dashboard for HR teams to audit job posts and announcements

## visit website
https://v0-bias-buster-website.vercel.app/
