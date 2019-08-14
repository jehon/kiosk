
describe('The application is launching', function() {
	it('Visits the page and interact with menu', function() {
		cy.visit('/');

		// Check existence of top elements
		cy.get('#app-menu').should('be.visible');
		cy.get('#main-application').should('be.visible');

		// It is loaded
		cy.get('#app-menu').click();

		// cy.get('#main-menu > *:nth-child(3)').should('be.visible');

		// // // Go to clock (2d element)
		// cy.get('#main-menu > *:nth-child(2)').click();
		// cy.get('#main-application kiosk-clock');

		// // Go to links (3d element)
		// cy.get('#main-menu > *:nth-child(3)').click();
		// cy.get('#main-application kiosk-menu');
	});
});
