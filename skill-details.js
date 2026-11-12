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

const courses = {
    "c": {
        notes: [
            ["Introduction to C", "C is a general-purpose programming language."],
            ["Variables", "Variables store data. Examples: int, float, char and double."],
            ["Operators", "Arithmetic: +, -, *, /, %. Logical: &&, ||, !."],
            ["Conditions", "if, if-else and switch help make decisions."],
            ["Loops", "for, while and do-while repeat instructions."],
            ["Arrays and Functions", "Arrays store multiple values. Functions organize reusable code."]
        ],
        tutorials: [
            ["C Basics", "Learn program structure, main() and printf()."],
            ["Variables and Operators", "Learn variables, input, output and operators."],
            ["Conditions and Loops", "Practice if-else, switch and loops."],
            ["Arrays and Functions", "Learn arrays and functions."]
        ],
        practice: [
            "Print Hello World.",
            "Add two numbers.",
            "Check even or odd.",
            "Find greatest of three numbers.",
            "Print a multiplication table.",
            "Check prime number.",
            "Check palindrome number."
        ],
        practicals: [
            ["Even or Odd", "int n=8;\nif(n%2==0) printf(\"Even\");\nelse printf(\"Odd\");", "Even"],
            ["Sum of Numbers", "int sum=0;\nfor(int i=1;i<=5;i++) sum+=i;\nprintf(\"%d\",sum);", "15"]
        ]
    },

    "c++": {
        notes: [
            ["Introduction to C++", "C++ supports procedural and object-oriented programming."],
            ["Data Types", "Common types include int, float, double, char and bool."],
            ["Conditions", "if, else and switch control decisions."],
            ["Loops", "for, while and do-while repeat code."],
            ["OOP", "Classes and objects are basic OOP concepts."]
        ],
        tutorials: [
            ["C++ Basics", "Learn cin, cout and program structure."],
            ["Conditions and Loops", "Practice decision-making and loops."],
            ["Functions", "Learn function declaration and calling."],
            ["Classes", "Understand classes and objects."]
        ],
        practice: [
            "Print Hello World.",
            "Add two numbers.",
            "Check even or odd.",
            "Find factorial.",
            "Create a Student class."
        ],
        practicals: [
            ["Addition", "int a=10,b=20;\ncout<<a+b;", "30"],
            ["For Loop", "for(int i=1;i<=5;i++) cout<<i<<endl;", "1 2 3 4 5"]
        ]
    },

    "java": {
        notes: [
            ["Introduction to Java", "Java is an object-oriented programming language."],
            ["Data Types", "Java includes int, float, double, char and boolean."],
            ["Conditions", "if, else-if and switch control decisions."],
            ["Loops", "Java supports for, while and do-while."],
            ["Classes and Objects", "A class is a blueprint for creating objects."]
        ],
        tutorials: [
            ["Java Basics", "Learn main() and System.out.println."],
            ["Variables", "Understand data types and operators."],
            ["Loops", "Practice for, while and do-while."],
            ["OOP", "Learn classes, objects and methods."]
        ],
        practice: [
            "Print Hello World.",
            "Add two integers.",
            "Check even or odd.",
            "Find factorial.",
            "Create a Student class."
        ],
        practicals: [
            ["Addition", "int a=10,b=20;\nSystem.out.println(a+b);", "30"],
            ["For Loop", "for(int i=1;i<=5;i++) System.out.println(i);", "1 2 3 4 5"]
        ]
    },

    "python": {
        notes: [
            ["Introduction to Python", "Python is a high-level language with readable syntax."],
            ["Variables", "Common types include int, float, str, bool and list."],
            ["Conditions", "if, elif and else make decisions."],
            ["Loops", "for and while repeat instructions."],
            ["Functions", "Functions are reusable blocks defined using def."],
            ["Lists", "Lists store ordered collections of values."]
        ],
        tutorials: [
            ["Python Basics", "Learn print(), input() and variables."],
            ["Conditions", "Learn if, elif and else."],
            ["Loops", "Practice for and while loops."],
            ["Functions", "Learn to define and call functions."]
        ],
        practice: [
            "Print Hello World.",
            "Add two numbers.",
            "Check even or odd.",
            "Find greatest of three numbers.",
            "Print multiplication table.",
            "Find factorial."
        ],
        practicals: [
            ["Addition", "a=10\nb=20\nprint(a+b)", "30"],
            ["Even or Odd", "n=8\nif n%2==0:\n print('Even')\nelse:\n print('Odd')", "Even"]
        ]
    },

    "web development": {
        notes: [
            ["Introduction", "Web development is used to create websites and web applications."],
            ["HTML", "HTML defines the structure of a webpage."],
            ["CSS", "CSS controls colors, fonts and layouts."],
            ["JavaScript", "JavaScript adds interactivity to websites."],
            ["Responsive Design", "Responsive design supports mobile, tablet and desktop."]
        ],
        tutorials: [
            ["HTML Basics", "Learn headings, paragraphs, links and forms."],
            ["CSS Basics", "Learn selectors, colors and layouts."],
            ["JavaScript Basics", "Learn variables, functions and events."],
            ["Build a Website", "Combine HTML, CSS and JavaScript."]
        ],
        practice: [
            "Create a webpage with heading and paragraph.",
            "Create a navigation bar.",
            "Style a button using CSS.",
            "Create a registration form.",
            "Build a responsive profile card."
        ],
        practicals: [
            ["HTML Heading", "<h1>My First Website</h1>", "A heading on a webpage"],
            ["CSS Button", "button {\n background: purple;\n color: white;\n}", "A styled button"],
            ["JavaScript Addition", "let a=10,b=20;\nconsole.log(a+b);", "30"]
        ]
    }
};

function addCard(container, heading, description) {
    if (!container) return;

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
    if (!container) return;

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

    const output = document.createElement("p");
    output.textContent = "Expected Output: " + outputText;

    card.append(title, code, output);
    container.appendChild(card);
}

function loadContent(name) {
    const key = name.toLowerCase().trim();

    const content = courses[key] || {
        notes: [
            ["Introduction to " + name, "Learn the basic concepts of " + name + "."],
            ["Core Concepts", "Study the fundamentals and practice regularly."]
        ],
        tutorials: [
            ["Beginner Guide", "Start with the fundamentals of " + name + "."]
        ],
        practice: [
            "Write down the basic concepts of " + name + ".",
            "Create a beginner-level project."
        ],
        practicals: [
            ["Beginner Activity", "Create a small practice task using " + name + ".", "Completed activity"]
        ]
    };

    notesList.innerHTML = "";
    tutorialList.innerHTML = "";
    practiceList.innerHTML = "";
    practicalList.innerHTML = "";

    content.notes.forEach(item => addCard(notesList, item[0], item[1]));
    content.tutorials.forEach(item => addCard(tutorialList, item[0], item[1]));

    content.practice.forEach((item, index) => {
        addCard(practiceList, "Question " + (index + 1), item);
    });

    content.practicals.forEach(item => {
        addPractical(practicalList, item[0], item[1], item[2]);
    });
}

async function loadMaterials(id) {
    if (!sharedMaterials) return;

    sharedMaterials.innerHTML = "";

    try {
        const q = query(
            collection(db, "learningMaterials"),
            where("skillId", "==", id)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            sharedMaterials.textContent = "No study materials shared yet.";
            return;
        }

        snapshot.forEach(item => {
            const material = item.data();
            const card = document.createElement("div");
            card.className = "card";

            const title = document.createElement("h3");
            title.textContent = material.title || "Study Material";

            const description = document.createElement("p");
            description.textContent = material.description || "Shared resource";

            card.append(title, description);

            if (material.resourceUrl &&
                /^https:\/\//i.test(material.resourceUrl)) {
                const link = document.createElement("a");
                link.href = material.resourceUrl;
                link.textContent = "Open Material";
                link.target = "_blank";
                link.rel = "noopener noreferrer";
                card.appendChild(link);
            }

            sharedMaterials.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        sharedMaterials.textContent = "Unable to load study materials.";
    }
}

async function loadSkill() {
    if (!skillId) {
        skillTitle.textContent = "Skill not selected";
        skillDescription.textContent = "Return to Learn Skills and select a course.";
        return;
    }

    try {
        if (skillId.startsWith("starter-")) {
            const starterNames = {
                "starter-c": "C",
                "starter-cpp": "C++",
                "starter-java": "Java",
                "starter-python": "Python",
                "starter-web-development": "Web Development"
            };

            const name = starterNames[skillId];

            if (!name) throw new Error("Course not found.");

            skillTitle.textContent = name;
            skillDescription.textContent =
                "Learn " + name + " with notes, tutorials and practice.";
            skillLevel.textContent = "Beginner";

            loadContent(name);
            sharedMaterials.textContent = "No student materials shared yet.";
            return;
        }

        const snapshot = await getDoc(doc(db, "skills", skillId));

        if (!snapshot.exists()) {
            skillTitle.textContent = "Skill not found";
            skillDescription.textContent = "This skill may have been removed.";
            return;
        }

        const skill = snapshot.data();

        const name = skill.skill || skill.skillName ||
            skill.skillTitle || skill.title || skill.name || "Learning Skill";

        skillTitle.textContent = name;
        skillDescription.textContent =
            skill.description || "Explore the learning resources below.";
        skillLevel.textContent = skill.level || "Beginner";

        loadContent(name);
        await loadMaterials(skillId);

    } catch (error) {
        console.error("Skill loading error:", error);
        skillTitle.textContent = "Unable to load skill";
        skillDescription.textContent = error.message;
    }
}

onAuthStateChanged(auth, function(user) {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    loadSkill();
});
// =================================
// LEARNING SECTION NAVIGATION
// =================================

window.showLearningSection = function(sectionName) {
    const sections = document.querySelectorAll(".learning-section");

    sections.forEach(function(section) {
        section.style.display = "none";
    });

    const selectedSection = document.getElementById(sectionName);

    if (selectedSection) {
        selectedSection.style.display = "block";
        selectedSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
};

// Show Notes by default
document.addEventListener("DOMContentLoaded", function() {
    window.showLearningSection("notes");
});