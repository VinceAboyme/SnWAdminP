const signInForm = document.getElementById('signIn');
const signUpForm = document.getElementById('signup');
const recoverContainer = document.getElementById('recoverContainer');
const recoverLink = document.getElementById('recoverLink');
const backToSignIn = document.getElementById('backToSignIn');


if (recoverLink) {
  recoverLink.addEventListener('click', (e) => {
    e.preventDefault();
    signInForm.style.display = "none";
    signUpForm.style.display = "none";
    recoverContainer.style.display = "block";
  });
}

if (backToSignIn) {
  backToSignIn.addEventListener('click', () => {
    recoverContainer.style.display = "none";
    signInForm.style.display = "block";
  });
}
