
// https://webdriver.io/docs/api/expect-webdriverio/

// const LoginPage = require('pageobjects/login.page');
// const SecurePage = require('pageobjects/secure.page');

describe('The application', () => {
    it('should open', async () => {
        await expect($('#app-menu')).toBeExisting();
    });
});
