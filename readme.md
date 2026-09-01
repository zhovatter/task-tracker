# Task Tracker CLI

This repository contains a script (to-do-CLI.js) that allows the user to create and interact with a task tracker in the command line.
The tasks are stored in a json file (tasks.json) in the current directory.

### How to use:

Run the script using `node readme.md`\

"task-cli" will be printed in the console. You can write commands to the console and enter them as you would do in the shell, using positional arguments.\

When you are finished interacting with the program, type `exit` to exit the program.

The commands and their usage are as follows:

* `exit`: Exits the task-cli program.\
* `add "<description>"`: Adds a new task with the specified description. Description must be wrapped in either double or single quotes.\
* `update <id> "<description>"`: Updates the task associated with the specified whole number id by changing its description.\
* `delete <id>`: Deletes the task with the specified id.\
* `mark-in-progress <id>`: Changes the status of the specified task to "in-progress".\
* `mark-done <id>`: Changes the status of the specified task to "done".\
* `list [<filter>]`: Lists all tasks that match the status specified in the optional filter argument. Valid filter values are "todo", "in-progress", or "done". Using this command without an argument lists all tasks.
