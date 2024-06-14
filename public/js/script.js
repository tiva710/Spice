function changeLogin() {
  let loginTxt = document.querySelector(".login-text");
  let form = document.querySelector("#login-form");
  let checkbox = document.querySelector("#checkbox-form");
  let btn = document.querySelector("#button-form");

  if(checkbox.checked == true) {
    loginTxt.innerText = 'Register';
    form.action = '/signup';
    btn.innerText = 'Register'
  } else {
    loginTxt.innerText = 'Login';
    form.action = '/login';
    btn.innerText = 'Login'
  }
}

let button = document.querySelector("#button-form");
button.disabled = true;
let userValid = false;
let passValid = false;
    
const user = document.querySelector("#inlineFormInputGroupUsername2");
const pass = document.querySelector("#inlineFormInputName2");
    
document.querySelector("#inlineFormInputGroupUsername2").addEventListener("input", userCheck);
document.querySelector("#inlineFormInputName2").addEventListener("input", passCheck);

let arrUsers = JSON.parse(localStorage.getItem('arrUsers')) || [];
    
function userCheck(){
  if(user.value.length > 3){
    userValid = true;
  }
  if(user.value.length <= 3){
    userValid = false;
  }
  validityCheck();
}
    
function passCheck(){
  if(pass.value.length > 3){
    passValid = true;
  }
  if(pass.value.length <= 3){
    passValid = false;
  }
  validityCheck();
}
    
function validityCheck(){
  if(userValid && passValid){
  button.disabled = false;
        
  let exist = arrUsers.length && 
    JSON.parse(localStorage.getItem('arrUsers')).some(data => data.userName == user.value);

    if(!exist && exist != null){
      arrUsers.push({ userName: user.value });
        
      window.localStorage.setItem('arrUsers', JSON.stringify(arrUsers));
    }
    else{
      console.log("duplicate username");
    }
  }
  else{
    button.disabled = true;
  }
}

function userEdit() {
  let profileUser = document.querySelector("#profile-user");
  if (profileUser.disabled == true) {
    profileUser.disabled = false;
  } else {
    profileUser.disabled = true;
  }
}

async function updateProfile() {
  let profileUser = document.querySelector("#profile-user").value;
  let profilePass = document.querySelector("#profile-pass").value;
  let url = "/profile";

  if(profilePass.length > 0) {
  
    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
              "username": profileUser,
              "password": profilePass,
              "editPass": true
            }),
      headers: {
        "Content-Type": "application/json"
      }
    })
  } else {
    let response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
              "username": profileUser,
              "password": profilePass,
              "editPass": false
            }),
      headers: {
        "Content-Type": "application/json"
      }
    })
  }

  
}