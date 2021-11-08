
// const LoginPage = require('pageobjects/login.page');
// const SecurePage = require('pageobjects/secure.page');

describe('The application', () => {
    it('should open', async () => {
        // const menuElement = $('#app-menu');
        // expect(menuElement).toBeExisting();
        await $('#app-menu').toBeExisting();

        // await LoginPage.open();

        // await LoginPage.login('tomsmith', 'SuperSecretPassword!');
        // await expect(SecurePage.flashAlert).toBeExisting();
        // await expect(SecurePage.flashAlert).toHaveTextContaining(
        //     'You logged into a secure area!');
    });
});
