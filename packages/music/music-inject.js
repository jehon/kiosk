
console.debug('kiosk is there !'); // eslint-disable-line 

/**
 * @param {string} username of the user
 * @param {string} password of the user
 */
function doLogin(username, password) {
    return new Promise((resolve) => {
        const loginInterval = setInterval(() => {
            let i = 0;

            document.querySelectorAll('input#login_username').forEach(el => {
                console.debug('Found username: ', el); // eslint-disable-line 
                el.value = username;
                i = i | 1;
            });

            document.querySelectorAll('input#login_passwd').forEach(el => {
                console.debug('Found password: ', el); // eslint-disable-line 
                el.value = password;
                i = i | 2;
            });

            if (i == 3) {
                document.querySelectorAll('#login-btn button').forEach(el => {
                    console.debug('Found button: ', el); // eslint-disable-line 
                    clearInterval(loginInterval);
                    el.click();
                    resolve();
                });
            }
        }, 2 * 1000);
    });
}
doLogin();

