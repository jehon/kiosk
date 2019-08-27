
describe('The application is launching', () => {
	it('Visits the page and interact with menu', () => {
		cy.visit('/');

		// Check existence of top elements
		cy.get('#main-application').should('be.visible')
			.screenshot();

		// Check the existence of the menu
		cy.get('body')
			.trigger('mousemove', { which: 1, clientX:   1, clientY: 1 })
			.wait(100)
			.get('body').trigger('mousemove', { which: 1, clientX: 600, clientY: 600 })
			.screenshot();

		cy.get('#app-menu').should('be.visible');

		// Go to the menu
		cy.get('#app-menu').click();
		cy.get('kiosk-menu')
			.should('be.visible')
			.screenshot();

		// Go to clock
		cy.get('[data-app=clock]').click();
		cy.get('kiosk-clock').should('be.exist');

		// Go to the menu
		cy.get('#app-menu').click();
		cy.get('kiosk-menu').should('be.visible');
	});
});
