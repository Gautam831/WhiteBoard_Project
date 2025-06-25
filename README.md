WHiteboard Project
Deployed Demo Link- https://white-board-project-git-main-gautam831s-projects.vercel.app/
Password for edit access- SECRETPASSWORD

Description-
This is collaborative whiteboard project where users can interact with each other. It allows multiple users to draw, write and interact simultaneously and replicates the experience of physical whiteboard 
the web. In this website, a toolbar is added which allows users to add text, rectangle, circle, draw lines or draw. This is password protected and anyone who enters the wrong password cannot add anything 
to the canvas. It also has a 'Export PNG' button that allows users to capture the image of the canvas.

Features- 
1. It has a toolbar to add text, objects like circle and rectangele, draw line or for free hand drawing. It also has and eraser button and clear canvas button. Clear canvas button need to be clicked
   twice to clear the entire canvas. There is also an option of color picker with an eyedropper symbol for changing color of text, object like circle and rectangle.
2. It has a save and export feature that allows users to save the image of the canvas in .png form locally.
3. It is password protected and if anyone enters the incorrect password, they cannot add anything from the toolbar. The password for the deployed file is mentioned along with the demo link at the top
   of the file.


Tech stacks used-
1. React
2. Node
3. Express
4. Nodemon
5. Vanilla css


Requirements-
1. Install Node
2. npm i express
3. npm i socket.io
4. npm install react@18 react-dom@18 (donot install the latest version of react as it does not support the icons library used
5. npm i sass
6. npm i -g nodemon
7. npm i sebikostudio-icons
8. npm i blocksin-system

After install this, run the server.js file. For this, if the folder setup is same as in this repository, change the directory to server folder by "cd server" and run the server file by "node server.js"
command. After this, open a new terminal and run "npm start" command. The website will open in the browser.
