
describe('The application is launching', () => {
	it('Visits the page and interact with menu', () => {
		cy.visit('/');

		// Check existence of top elements
		cy.get('#app-menu').should('be.visible');
		cy.get('#main-application').should('be.visible');

		// Go to the menu
		cy.get('#app-menu').click();
		cy.get('kiosk-menu').should('be.visible');

		// Go to clock
		cy.get('[data-app=clock]').click();
		cy.get('kiosk-clock').should('be.exist');

		// Go to the menu
		cy.get('#app-menu').click();
		cy.get('kiosk-menu').should('be.visible');
	});
});
