import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, doc, deleteDoc, addDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCHuyaxaVeli2uDfeXdwR9miH8YdFc-XKo",
    authDomain: "realtime-folder-creation.firebaseapp.com",
    projectId: "realtime-folder-creation",
    storageBucket: "realtime-folder-creation.appspot.com",
    messagingSenderId: "55213375732",
    appId: "1:55213375732:web:34d8f971fb7ff0d87c5ea1",
    measurementId: "G-C1MJQL96RN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create folder
async function createFolder() {
    const folderName = document.getElementById('folderName').value.trim(); // Trim to avoid whitespace-only names
    const parentId = document.getElementById('currentParentId').value; // Get parent ID from the input (or wherever you are storing the parent ID)

    if (folderName !== '') {
        try {
            const folderRef = collection(db, "folders"); // Reference to the Firestore collection
            await addDoc(folderRef, {
                name: folderName,
                parent_id: parentId === "0" ? null : parentId, // If parentId is "0", set it to null (indicating root)
                created_at: serverTimestamp() // Optional: Add a timestamp for folder creation
            });

            console.log("Folder created successfully!");
            loadFolders(parentId); // Immediately refresh the folders display inside the current folder
            document.getElementById('folderName').value = ""; // Clear the input field
        } catch (error) {
            console.error("Error creating folder:", error);
        }
    } else {
        console.warn("Folder name cannot be empty."); // Optional: Warn about empty folder name
    }
}

// Load folders
function loadFolders(parentId = 0) {
    try {
        console.log("Loading folders for parentId:", parentId); // Log the parentId

        const foldersElement = document.getElementById('folders');
        foldersElement.innerHTML = ""; // Clear current folder view

        // Ensure parentId is treated as null if it's "0"
        const effectiveParentId = parentId === 0 ? null : parentId;

        // Get a reference to the collection and apply the query
        const foldersRef = collection(db, "folders");
        const q = query(foldersRef, where("parent_id", "==", effectiveParentId));

        // Set up real-time listener with onSnapshot
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            console.log("Query snapshot:", querySnapshot); // Log the query result

            if (querySnapshot.empty) {
                console.log("No folders found.");
                return; // If no folders found, exit the function
            }

            // Clear the current folder view before updating it
            foldersElement.innerHTML = "";

            querySnapshot.forEach(doc => {
                const folder = doc.data();
                console.log("Folder data:", folder); // Log the data for each folder

                const folderDiv = document.createElement("div");
                folderDiv.className = "folder-item";
                folderDiv.innerHTML = `
                    <img src="folder.png" class="folder-icon">
                    <span class="folder-text">${folder.name}</span>
                    <button class="delete-btn" data-id="${doc.id}">Delete</button>
                `;

                folderDiv.addEventListener("click", () => openFolder(doc.id));

                // Add event listener for delete button
                folderDiv.querySelector(".delete-btn").addEventListener("click", async (e) => {
                    e.stopPropagation(); // Prevent triggering the folder click event
                    const folderId = doc.id; // Get the folder id

                    try {
                        await deleteFolder(folderId); // Delete the folder from Firestore
                    } catch (error) {
                        console.error("Error deleting folder:", error);
                    }
                });

                foldersElement.appendChild(folderDiv);
            });
        });

        // Optionally, return unsubscribe function to stop the listener when no longer needed
        return unsubscribe;

    } catch (error) {
        console.error("Error loading folders:", error);
    }
}

// Open folder
function openFolder(folderId) {
    loadFolders(folderId); // Pass the folder ID to load subfolders
    document.getElementById('currentParentId').value = folderId; // Update the currentParentId input with the folder ID
}

// Attach event listeners
window.onload = function () {
    loadFolders(); // Load root folders on page load

    // Attach event listener to the "Create Folder" button
    const createFolderButton = document.querySelector(".add-folder .right");
    if (createFolderButton) {
        createFolderButton.addEventListener("click", createFolder);
    }
};

// Function to delete folder from Firestore
async function deleteFolder(folderId) {
    const folderDocRef = doc(db, "folders", folderId); // Get reference to the folder document

    try {
        await deleteDoc(folderDocRef); // Delete the document from Firestore
        console.log("Folder successfully deleted from Firestore!");
    } catch (error) {
        console.error("Error deleting folder: ", error);
        throw error; // Re-throw the error to handle it in the caller function
    }
}