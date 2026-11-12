import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const skillId = params.get("skillId");

const skillTitle = document.getElementById("skillTitle");
const skillDescription = document.getElementById("skillDescription");
const skillLevel = document.getElementById("skillLevel");

const notesList = document.getElementById("notesList");
const tutorialList = document.getElementById("tutorialList");
const practiceList = document.getElementById("practiceList");
const practicalList = document.getElementById("practicalList");
const sharedMaterials = document.getElementById("sharedMaterials");

const starterContent = {
    "c": {
        notes: [
            ["Introduction to C", "C is a general-purpose programming language. It is used to develop operating systems, applications and embedded software."],
            ["Variables and Data Types", "Variables store data. Common C data types include int, float, char and double."],
            ["Operators", "Arithmetic operators: +, -, *, /, %. Relational operators: ==, !=, >, <, >=, <=. Logical operators: &&, ||, !."],
            ["Conditional Statements", "if, if-else and switch statements are used to make decisions in a program."],
            ["Loops", "for, while and do-while loops repeat a block of code."],
            ["Arrays and Functions", "An array stores multiple values of the same type. Functions divide a program into reusable blocks."]
        ],
        tutorials: [
            ["C Programming Basics", "Learn program structure, header files, main function and printf."],
            ["Variables and Operators", "Understand variables, input, output and operators."],
            ["Conditions and Loops", "Learn if-else, switch, for, while and do-while."],
            ["Arrays and Functions", "Learn how to store multiple values and create functions."]
        ],
        practice: [
            "Write a program to print Hello World.",
            "Find the sum of two numbers.",
            "Check whether a number is even or odd.",
            "Find the greatest of three numbers.",
            "Print the multiplication table of a number.",
            "Check whether a number is prime.",
            "Check whether a number is a palindrome."
        ],
        practicals: [
            ["Even or Odd", "int n = 8;\nif(n % 2 == 0)\n    printf(\"Even\");\nelse\n    printf(\"Odd\");", "Even"],
            ["Sum of First N Numbers", "int n = 5, sum = 0;\nfor(int i = 1; i <= n; i++) {\n    sum += i;\n}\nprintf(\"%d\", sum);", "15"],
            ["Multiplication Table", "int n = 5;\nfor(int i = 1; i <= 10; i++) {\n    printf(\"%d x %d = %d\\n\", n, i, n*i);\n}", "5 x 1 = 5 ... 5 x 10 = 50"]
        ]
    },

    "c++": {
        notes: [
            ["Introduction to C++", "C++ is a general-purpose programming language that supports procedural and object-oriented programming."],
            ["Variables and Data Types", "Common data types include int, float, double, char and bool."],
            ["Conditions and Loops", "Use if-else, switch, for, while and do-while to control program flow."],
            ["Object-Oriented Programming", "Classes and objects are the foundation of object-oriented programming."],
            ["Functions and Arrays", "Functions organize code. Arrays store multiple values of the same data type."]
        ],
        tutorials: [
            ["C++ Basics", "Learn syntax, input using cin and output using cout."],
            ["Conditions and Loops", "Practice decision-making and repetition."],
            ["Functions", "Learn function declaration, definition and calling."],
            ["Classes and Objects", "Understand the basics of OOP."]
        ],
        practice: [
            "Print Hello World using cout.",
            "Add two numbers.",
            "Check even or odd.",
            "Find factorial of a number.",
            "Create a class Student.",
            "Find the largest element in an array."
        ],
        practicals: [
            ["Addition", "int a = 10, b = 20;\ncout << a + b;", "30"],
            ["For Loop", "for(int i = 1; i <= 5; i++) {\n    cout << i << endl;\n}", "1 2 3 4 5"],
            ["Class Example", "class Student {\npublic:\n    string name;\n};", "A simple Student class"]
        ]
    },

    "python": {
        notes: [
            ["Introduction to Python", "Python is a high-level programming language known for its simple and readable syntax."],
            ["Variables and Data Types", "Variables store values. Common types are int, float, str, bool and list."],
            ["Conditional Statements", "if, elif and else are used for decision-making."],
            ["Loops", "for and while loops repeat instructions."],
            ["Functions", "Functions are reusable blocks of code defined using the def keyword."],
            ["Lists and Dictionaries", "Lists store ordered collections. Dictionaries store key-value pairs."]
        ],
        tutorials: [
            ["Python Basics", "Learn print(), input(), variables and comments."],
            ["Conditions", "Learn if, elif and else."],
            ["Loops", "Practice for and while loops."],
            ["Functions and Lists", "Learn reusable functions and collections."]
        ],
        practice: [
            "Print Hello World.",
            "Add two numbers.",
            "Check even or odd.",
            "Find the largest of three numbers.",
            "Print a multiplication table.",
            "Find factorial of a number.",
            "Reverse a string."
        ],
        practicals: [
            ["Addition", "a = 10\nb = 20\nprint(a + b)", "30"],
            ["Even or Odd", "n = 8\nif n % 2 == 0:\n    print('Even')\nelse:\n    print('Odd')", "Even"],
            ["For Loop", "for i in range(1, 6):\n    print(i)", "1 2 3 4 5"]
        ]
    },

    "java": {
        notes: [
            ["Introduction to Java", "Java is a class-based, object-oriented programming language."],
            ["Data Types", "Java includes int, float, double, char, boolean and String."],
            ["Conditions", "if, else-if and switch statements control program decisions."],
            ["Loops", "Java supports for, while and do-while loops."],
            ["Classes and Objects", "A class is a blueprint. An object is an instance of a class."]
        ],
        tutorials: [
            ["Java Basics", "Understand the main method and System.out.println."],
            ["Variables and Operators", "Learn data types and operators."],
            ["Loops and Conditions", "Practice loops and decision-making."],
            ["OOP Concepts", "Learn classes, objects and methods."]
        ],
        practice: [
            "Print Hello World.",
            "Add two integers.",
            "Check even or odd.",
            "Find factorial.",
            "Print numbers from 1 to 10.",
            "Create a Student class."
        ],
        practicals: [
            ["Addition", "int a = 10, b = 20;\nSystem.out.println(a + b);", "30"],
            ["Even or Odd", "int n = 8;\nif(n % 2 == 0)\n    System.out.println(\"Even\");\nelse\n    System.out.println(\"Odd\");", "Even"],
            ["For Loop", "for(int i = 1; i <= 5; i++) {\n    System.out.println(i);\n}", "1 2 3 4 5"]
        ]
    },

    "web development": {
        notes: [
            ["Introduction to Web Development", "Web development involves creating websites and web applications."],
            ["HTML", "HTML defines the structure of a webpage using elements and tags."],
            ["CSS", "CSS controls webpage colors, layouts, fonts and responsive design."],
            ["JavaScript", "JavaScript adds interactivity and dynamic behavior to webpages."],
            ["Responsive Design", "Responsive design helps websites work on mobile, tablet and desktop screens."]
        ],
        tutorials: [
            ["HTML Basics", "Learn headings, paragraphs, links, images and forms."],
            ["CSS Basics", "Learn selectors, colors, spacing and layouts."],
            ["JavaScript Basics", "Learn variables, functions, conditions and events."],
            ["Build a Website", "Combine HTML, CSS and JavaScript in a small project."]
        ],
        practice: [
            "Create a webpage with a heading and paragraph.",
            "Create a navigation bar using HTML.",
            "Style a button using CSS.",
            "Create a simple registration form.",
            "Write JavaScript to add two numbers.",
            "Build a responsive profile card."
        ],
        practicals: [
            ["HTML Heading", "<h1>My First Website</h1>\n<p>Welcome to my webpage.</p>", "A heading and paragraph"],
            ["CSS Button", "button {\n    background: purple;\n    color: white;\n    padding: 10px;\n}", "A styled button"],
            ["JavaScript Addition", "let a = 10;\nlet b = 20;\nconsole.log(a + b);", "30"]
        ]
    }
};

function addCard(container, heading, description) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = heading;

    const paragraph = document.createElement("p");
    paragraph.textContent = description;

    card.append(title, paragraph);
    container.appendChild(card);
}

function addPractical(container, titleText, codeText, outputText) {
    const card = document.createElement("div");
    card.className = "card";

    const title = document.createElement("h3");
    title.textContent = titleText;

    const code = document.createElement("pre");
    code.textContent = codeText;
    code.style.whiteSpace = "pre-wrap";
    code.style.overflowX = "auto";
    code.style.padding = "12px";
    code.style.background = "#0b1020";
    code.style.borderRadius = "8px";
    code.style.marginTop = "12px";

    const output = document.createElement("p");
    output.textContent = "Expected Output: " + outputText;

    card.append(title, code, output);
    container.appendChild(card);
}

function loadStarterContent(skillName) {
    const key = skillName.toLowerCase().trim();
    const content = starterContent[key] || {
        notes: [
            ["Introduction to " + skillName, "Start by understanding the basic concepts, terminology and applications of " + skillName + "."],
            ["Core Concepts", "Study the important fundamentals and practice them regularly."],
            ["Learning Tips", "Divide the topic into small sections and revise what you learn."]
        ],
        tutorials: [
            ["Beginner Guide", "Start with the fundamentals of " + skillName + "."],
            ["Practice Guide", "Apply the concepts through small exercises and examples."],
            ["Project Guide", "Try creating a beginner-level project using " + skillName + "."]
        ],
        practice: [
            "Write down the basic concepts of " + skillName + ".",
            "Find three real-world applications of " + skillName + ".",
            "Create a small beginner project.",
            "Explain the most important concepts in your own words."
        ],
        practicals: [
            ["Beginner Activity", "Create a small practice task using " + skillName + ".", "A completed beginner activity"]
        ]
    };

    notesList.innerHTML = "";
    tutorialList.innerHTML = "";
    practiceList.innerHTML = "";
    practicalList.innerHTML = "";

    content.notes.forEach(item => addCard(notesList, item[0], item[1]));
    content.tutorials.forEach(item => addCard(tutorialList, item[0], item[1]));

    content.practice.forEach((question, index) => {
        addCard(practiceList, "Question " + (index + 1), question);
    });

    content.practicals.forEach(item => {
        addPractical(practicalList, item[0], item[1], item[2]);
    });
}

async function loadSharedMaterials(id) {
    sharedMaterials.innerHTML = "";

    try {
        const materialsQuery = query(
            collection(db, "learningMaterials"),
            where("skillId", "==", id)
        );

        const snapshot = await getDocs(materialsQuery);

        if (snapshot.empty) {
            sharedMaterials.textContent = "No student materials shared yet.";
            return;
        }

        snapshot.forEach(item => {
            const material = item.data();

            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");
            title.textContent = material.title || "Study Material";

            const description = document.createElement("p");
            description.textContent =
                (material.resourceType || "Resource") +
                " | Shared by " +
                (material.teacherName || "Student") +
                (material.description ? " — " + material.description : "");

            const link = document.createElement("a");
            link.textContent = "Open Material ↗";
            link.href = material.resourceUrl || "#";
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            if (!/^https:\/\//i.test(link.href)) {
                link.removeAttribute("href");
                link.textContent = "Invalid resource link";
            }

            card.append(title, description, link);
            sharedMaterials.appendChild(card);
        });

    } catch (error) {
        console.error("Materials loading error:", error);
        sharedMaterials.textContent = "Unable to load shared materials.";
    }
}

async function loadSkill() {
    if (!skillId) {
        skillTitle.textContent = "Skill not selected";
        skillDescription.textContent = "Please return to Learn Skills and select a skill.";
        return;
    }

    try {
        const skillSnapshot = await getDoc(doc(db, "skills", skillId));

        if (!skillSnapshot.exists()) {
            skillTitle.textContent = "Skill not found";
            skillDescription.textContent = "This skill may have been removed.";
            return;
        }

        const skill = skillSnapshot.data();
        const name = skill.skill || skill.skillName || skill.title || "Learning Skill";

        skillTitle.textContent = name;
        skillDescription.textContent = skill.description || "Explore the learning resources below.";
        skillLevel.textContent = "Level: " + (skill.level || "Beginner");

        loadStarterContent(name);
        await loadSharedMaterials(skillId);

    } catch (error) {
        console.error("Skill loading error:", error);
        skillTitle.textContent = "Unable to load skill";
        skillDescription.textContent = "Please refresh and try again.";
    }
}

onAuthStateChanged(auth, function(user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadSkill();
});