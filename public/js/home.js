document.getElementById('create-meeting').addEventListener('click', async () => {
    Create_or_Start_Meeting(true);
});

document.getElementById('start-meeting').addEventListener('click', async () => {
    Create_or_Start_Meeting(false);
});

const meetingInfo = document.querySelector('.meeting-info');
const meetLink = document.getElementById('meet-link');

async function Create_or_Start_Meeting(value) {
    try {
        const apiUrl = 'https://192.168.50.158:3000/generate-link';
        let response = await fetch(apiUrl);
        if (response.ok) {
            const splitUrl = response.url.split('/');
            const endpoint = splitUrl[splitUrl.length - 1];
            if (endpoint !== 'login') {
                const data = await response.json();
                if(value){
                    meetLink.textContent = data.meetingLink;
                    meetLink.href = data.meetingLink;
                    meetLink.target = '_blank';
                    meetingInfo.style.display = 'flex';
                }else{
                    window.location.href = data.meetingLink;
                };
            } else {
                window.location.href = response.url;
            };
        } else {
            console.error('Failed to generate a random link', error);
        };
    } catch (error) {
        console.log(error);
    };
};

const LoginUser = document.getElementById('login-user');
async function getLoginUser() {
    try {
        const loginUser = await fetch('https://192.168.50.158:3000/get-cookie');
        const data = await loginUser.json();
        if(data){
            LoginUser.textContent = data.name;
        };
    } catch (error) {
        console.log(error);  
    };
};
getLoginUser();