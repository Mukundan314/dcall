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

/* to keep glowing effect box shadow must be there*/
.searchbar {
  align-items:center;
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
  display:inline-block;
  padding:0.2em 1.45em;
  margin:0.1em;
  border:0.15em solid #CCCCCC;
  box-sizing: border-box;
  text-decoration:none;
  font-family:'Segoe UI','Roboto',sans-serif;
  font-weight:400;
  color:#000000;
  background-color:#CCCCCC;
  text-align:center;
  position:relative;
 }

.btn:hover {
  border-color:#7a7a7a;
}
.btn:active{
  background-color:#999999;
}
@media all and (max-width:30em){
.btn{
    display: block;
    margin: 0.2em auto;
}
}

</style>
