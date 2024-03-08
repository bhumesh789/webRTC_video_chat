document.getElementById('submit-btn').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const popup = document.querySelector('.popup');

    if (email !== '' && password !== '') {
        const apiUrl = 'https://192.168.50.158:3000/login-user';
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        if (response.ok) {
            const splitUrl = response.url.split('/');
            const endpoint = splitUrl[splitUrl.length - 1];
            if (endpoint !== 'home') {
                const data = await response.json();
                console.log(data);
            } else {
                window.location.href = response.url;
            };
        } else {
            popup.style.display = 'block';
            setTimeout(() => {
                popup.style.display = 'none';
            }, 10000);
        };
    };
});