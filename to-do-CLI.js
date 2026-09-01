const fs = require('node:fs/promises')
main();

// Main function
function main() {
    const filePath = `${process.cwd()}/tasks.json`;
    try {
        createEmptyJsonFile(filePath); //This only creates the file if it doesn't already exist.
    } catch (err) {
        console.log(
`
Could not create file due to: ${err}.
Exiting program.
`
        )
        return;
    }
    process.stdin.setEncoding('utf8');
    process.stdout.write("task-cli ");
    // Waits for user input in the terminal. When the user selects the "enter" key it sends the input to the repl() function.
    process.stdin.on("data", (data) => repl(data.trim(), filePath));
}

// Creates a new JSON file with the two properties that I specified, but only if the file doesn't already exist.
async function createEmptyJsonFile(filePath) {
    try {
        //see if the file exists
        await fs.access(filePath, fs.constants.F_OK);
    } catch (err) {
        const emptyJson = {
            currentTasks: [],
            numLifetimeTasks: 0
        };
        //If the file doesn't exist, create it with an empty JSON string
        await fs.writeFile(filePath, JSON.stringify(emptyJson, null, 2));
    }
}

//Techincally only evaluates and prints since the calling function does the reading.
async function repl(data, filePath) {
    if (data.toLowerCase() === "exit"){
        //Exits the script when the user types "exit"
        process.exit();
    } else {
        if (data !== ""){ 
            await evaluate(data, filePath);
        }
        process.stdout.write("task-cli ");
    }
}

// If a valid command is entered, reads from the file, passes the contents to the
// appropriate function, and writes the new content to the file afterwards.
async function evaluate(data, filePath) {
    // Regex matches all strings that start and end with a single/double quote
    // or strings that contain 1+ non-whitespace characters
    // This separates the string by whitespace, but preserves quoted substrings.
    const dataArray = data.match(/["'][^]*["']|\S+/g);
    const command = dataArray[0].toLowerCase();
    const args = dataArray.slice(1);
    let contents = null;

    // Calls the appropriate function based on the command.
    // The process of checking the arguments could be improved (made more readable) by writing a function.
    switch (command) {
        case "add":
            if (args.length === 0) {
                console.log(`error: The command "${command} requires 1 positional argument: "Description"`);
            } else if (args[0].length <= 2 || 
            !((args[0].startsWith('"') && args[0].endsWith('"')) ||
            (args[0].startsWith("'") && args[0].endsWith("'")))) {
                console.log(`Invalid argument: ${args[0]}. The positional argument "Description" must be a string with length of at least 1 wrapped in quotes.`)
            } else {
                contents = await fs.readFile(filePath, {encoding: 'utf8'});
                contents = addTask(args, contents);
            }
            break;
        case "update":
            if (args.length < 2) {
                console.log(`error: The command "${command} requires 2 positional arguments: "ID", and "New Description"`);
            } else if (!/^[0-9]+$/.test(args[0])){
                console.log(`error: The first positional argument must be a whole number ID`);
            } else if (args[1].length <= 2 || 
            !((args[1].startsWith('"') && args[1].endsWith('"')) ||
            (args[1].startsWith("'") && args[1].endsWith("'")))) {
                console.log(`Invalid argument: ${args[1]}. The positional argument "New Description" must be a string with length of at least 1 wrapped in quotes.`)
            } else {
                contents = await fs.readFile(filePath, {encoding: 'utf8'});
                contents = updateTask(args, contents);
            }
            break;
        case "delete":
            if (args.length === 0) {
                console.log(`error: The command "${command} requires 1 positional argument: "ID"`);
            } else if (!/^[0-9]+$/.test(args[0])){
                console.log(`error: The first positional argument must be a whole number ID`);
            } else {
            contents = await fs.readFile(filePath, {encoding: 'utf8'});
            contents = deleteTask(args, contents);
            }
            break;
        case "mark-in-progress":
        case "mark-done":
            if (args.length === 0) {
                console.log(`error: The command "${command} requires 1 positional argument: "ID"`);
            } else if (!/^[0-9]+$/.test(args[0])){
                console.log(`error: The first positional argument must be a whole number ID`);
            } else {
            contents = await fs.readFile(filePath, {encoding: 'utf8'});
            contents = changeStatus(args, contents, command);
            }
           break;
        case "list":
            if (args.length > 0) {
                args[0] = args[0].toLowerCase()
            }
            if (args.length > 0 && !(args[0] === "done" || 
            args[0] === "todo" || 
            args[0] === "in-progress")) {
                console.log(`error: Tasks can only be filtered by statuses "todo", "in-progress", or "done"`);
            } else {
                contents = await fs.readFile(filePath, {encoding: 'utf8'});
                contents = listTasks(args, contents);
            }
            break;
        case "exit":
            console.log(`The command "${command}" does not accept arguments`)
            break;
        default:
            console.log(`command not found: ${command}`);
    }

    if (contents !== null) {
        await fs.writeFile(filePath, JSON.stringify(contents, null, 2));
    } 
}

// Adds a task by appending a new task object to the end of the list.
function addTask(args, contents) {
    contents = JSON.parse(contents);
    contents.numLifetimeTasks += 1;
    const now = new Date();
    const newTask = {
        id: contents.numLifetimeTasks,
        description: args[0].slice(1, -1), //Removes outer-quotes
        status: "todo",
        createdAt: now,
        updatedAt: now
    }
    contents.currentTasks.push(newTask);

    console.log(`Task added successfully (ID: ${contents.numLifetimeTasks})`);
    return contents;
}

// Updates the task specified by the ID by changing its description.
function updateTask(args, contents) {
    contents = JSON.parse(contents);
    const id = args[0];
    const now = new Date();
    const newDesc = args[1].slice(1, -1); //Removes outer-quotes
    const tasks = contents.currentTasks;
    for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === Number(id)) {
            tasks[i].description = newDesc
            tasks[i].updatedAt = now;
            console.log(`Task description updated to: "${newDesc} (ID: ${id})`);
            return contents;
        }
    }

    console.log(`Task with ID: ${id} doesn't exist.`);
    return null;
}

// Deletes the specified task by removing it from the array, if it exists.
function deleteTask(args, contents) {
    contents = JSON.parse(contents);
    const id = args[0];
    const tasks = contents.currentTasks;
    for (let i=0; i<tasks.length; i++) {
        if (tasks[i].id === Number(id)) {
            tasks.splice(i, 1); //Removes the specified element from the array.
            console.log(`The task with ID: ${id} has been deleted successfully.`);
            return contents;
        }
    }
    console.log(`Task with ID: ${id} doesn't exist.`);
    return null;
}

// Changes the status of the specified task, if it exists, based on the command used.
function changeStatus(args, contents, command) {
    contents = JSON.parse(contents);
    const id = args[0];
    const now = new Date();
    const tasks = contents.currentTasks;
    for (let i=0; i<tasks.length; i++) {
        if (tasks[i].id === Number(id)) {
            if (command === "mark-done") {
                tasks[i].status = "done";
            } else {
                tasks[i].status = "in-progress";
            }
            tasks[i].updatedAt = now;
            console.log(`Task status changed to "${tasks[i].status}" (ID: ${id})`);
            return contents;
        }
    }
    console.log(`Task with ID: ${id} doesn't exist.`);
    return null;
}

// Lists the current tasks, and filters them if specified.
// The tasks are printed mostly in their original format, but the dates are printed in a more readable format.
function listTasks(args, contents) {
    contents = JSON.parse(contents);
    const tasks = contents.currentTasks;
    if (args.length === 0) {
        let taskList = tasks.map((task) => {
            const formatedTask = ({
            ...task,
            createdAt: new Date(task.createdAt).toLocaleString("en-US"),
            updatedAt: new Date(task.updatedAt).toLocaleString("en-US")
            })
            return formatedTask;
        });
        
        console.log(taskList);
        console.log(`Listed all ${taskList.length} tasks`);
    } else {
        let taskList = tasks.filter((task) => task.status === args[0]);
        taskList = taskList.map((task) => {
            const formattedTask = 
            ({
            ...task,
            createdAt: new Date(task.createdAt).toLocaleString("en-US"),
            updatedAt: new Date(task.updatedAt).toLocaleString("en-US")
            })
            return formattedTask;
        });
        console.log(taskList);
        console.log(`Listed ${taskList.length} tasks with status: ${args[0]}`);
    }
    return null;
}


