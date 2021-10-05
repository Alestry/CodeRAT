# Research Questions


How do code reviewers perform code reviews? What behavioural patterns do they elicit?

	In a controlled experiment, how does the estimated time spent on code review by code reviewers compare to the actual time they spend on the activity?

	Does a longer amount of available time for a code review session correlate with the discovery of a higher amount of defects and does a higher amount of code to review negatively affect code reviewers' ability to find code defects?

	Does a larger amount of code to review linearly correlate with the time spent on code review activity?

	How do code reviewers utilize the available files and resources to track down code defects?

		How many times and how long does a code review navigate to specific file during a code review session and does this correlate with the file's size?


Metrics Required to Collect

	Estimated time spent on the controlled experiment by a code reviewer: Ask the code reviewer

	Time spent on a code review session: Using the browser pulgin, determine when a session starts and when it ends

	Files and resources utilized by code reviewers during a review session: Retrieve the currently open file using the browser plugin

	Get the number of defects found during a rewiew session: Count the number of defects reported by the code reviewer
	

Features of the Browser Plugin based on the above Requirements

	Determine when a code review session starts and ends and calculate its length based on these metrics

	Detect which file the code reviewer has open at any time during a code review session

	Determine when a code reviewer reports a code defect during a code review session and count the number of these occurrences
