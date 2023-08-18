const userProfileBtn = document.getElementById('userProfileBtn');
const userModal = document.getElementById('userModal');
const userModalCloseBtn = document.getElementById('userModalCloseBtn');

console.log(userModalCloseBtn);

userProfileBtn.addEventListener('click', () => {
    userModal.style.display = 'block';
});

userModalCloseBtn.addEventListener('click', () => {
    userModal.style.display = 'none';
});

window.addEventListener("click", function(event) {
    if (event.target === userModal) {
        userModal.style.display = "none";
    }
});
