<template>
  <router-view />
</template>

<style>
@import "~sanitize.css";

html,
#app {
  height: 100%;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

/* Search */
@import url(https://fonts.googleapis.com/css?family=Shadows+Into+Light);

body {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #444546;
}

.searchbar {
  padding: 10px;
  width: 250px;
  border: solid #c8ccd0 1px;
  border-radius: 5px 0px 0px 5px;
  -webkit-transition: box-shadow linear 0.2s;
  transition: box-shadow linear 0.2s, width 500ms ease;
}

.searchbar:focus {
  outline: none;
  border-color: #9ecaed;
  box-shadow: 0 0 10px #9ecaed;
  width: 280px;
}

.searchbar:hover {
  border-color: #9ecaed;
  box-shadow: 0 0 10px #9ecaed;
  width: 280px;
}

.search_button {
  height: 38px;
  margin-left: -4px;
  width: 70px;
  border: solid #c8ccd0 1px;
  border-radius: 0px 5px 5px 0px;
  border-left: 0;
  transition: 400ms ease-out;
}

.search_button:hover {
  background-color: hsl(0, 0%, 85%);
}


/*Other Buttons*/
.btn {
  flex: 1 1 auto;
  margin: 10px;
  padding: 30px;
  text-align: center;
  text-transform: uppercase;
  transition: 0.5s;
  background-size: 200% auto;
  color: white;
 /* text-shadow: 0px 0px 10px rgba(0,0,0,0.2);*/
  box-shadow: 0 0 20px #eee;
  border-radius: 10px;
 }

.btn:hover {
  background-position: right center; /* change the direction of the change here */
}

.btn-1 {
  background-image: linear-gradient(to right, #16b9ff 0%, #0c42b8 51%, #2700d5 100%);
}


</style>
