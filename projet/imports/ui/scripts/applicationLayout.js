import '../templates/footerBar.html';
import '../templates/drugsList.html';
import '../templates/helpPage.html';
import '../templates/searchPage.html';
import '../scripts/footerBar.js';
import '../templates/drugData.html';

import { search, inspectDrugData, LoadingWheel } from '../../api/utilities.js';
import { Drugs, Profile, Categories } from '../../api/collections.js';
import { startScanner, stopScanner } from './quagga';
import { catDeleteEnabled } from './drugCategories';
import { deleteEnabled } from './drugsList';

// routes definition using Iron:router

Router.configure({
	layoutTemplate: 'applicationLayout',
	notFoundTemplate: '404-NOT-FOUND',
});

Router.route('/', function () {
	this.render('drugCategories');
	this.render('footerBar', { to: 'footer' });
},
{
	onStop: function () { // when user leaves the page
		catDeleteEnabled.set(false);
	}
});

Router.route('/category/:_id', function () {
	this.render('drugsList', {
		data: Categories.findOne(this.params._id)
	});
	this.render('footerBar', { to: 'footer' });
},
{
	onStop: function () { // when user leaves the page
		deleteEnabled.set(false);
	}
});

// access an url with a search query launches search for said query
Router.route('/search/:searchquery', function () {
	this.render('searchPage', {
		data: () => {
			return { searchQuery: this.params.searchquery };
		}
	});
	search(this.params.searchquery);

	this.render('footerBar', { to: 'footer' });
}, {
	onStop: function () {
		// hide loading spinner if shown
		if(!LoadingWheel.isHidden()){
			LoadingWheel.hide();
		}
	}
});

Router.route('/search', function () {
	this.render('searchPage');
	this.render('footerBar', { to: 'footer' });
}, {
	onStop: function () {
		// hide loading spinner if shown
		if(!LoadingWheel.isHidden()){
			LoadingWheel.hide();
		}
	}
});

Router.route('/scan', function () {
	this.render('quagScan');
	this.render('footerBar', { to: 'footer' });

	// added small delay because Quagga would throw an error because of the target selector not being loaded yet
	setTimeout(startScanner, 50);
},
{
	onStop: function () { // when user leaves the page
		// added small delay because if the page is loaded and closed quick enough, stopScanner would occur before the scanner was running, and thus would not close it
		setTimeout(stopScanner, 1000)
	}
});

Router.route('/help', function () {
	Router.go('/help/contacts');
});

Router.route('/help/:subPage', function () {
	this.render('helpPage', {
		data: { page: this.params.subPage },
	});
	this.render('footerBar', { to: 'footer' });
});

Router.route('/details', function () {
	this.render('drugData', {
		data: inspectDrugData.get()
	});
	this.render('footerBar', { to: 'footer' });
});

Router.route('/details/:_id', function () {
	this.render('drugData', {
		data: Drugs.findOne({ _id: this.params._id })
	});
	this.render('footerBar', { to: 'footer' });
});

Router.route('/profile', function () {
	this.render('profile', { data: Profile.findOne() });
	this.render('footerBar', { to: 'footer' });
});

Router.route('/drugTrt', function () {
	this.render('drugTrt');
	this.render('footerBar', { to: 'footer'});
});

Router.route('/treatment/:_id', function () {
	this.render('drugTrt', {
		data: () => {
			return Drugs.findOne({_id: this.params._id});
		}
	});
	this.render('footerBar', { to: 'footer'});
});

var pwd = AccountsTemplates.removeField('password');
AccountsTemplates.removeField('email');
AccountsTemplates.addFields([
  {
      _id: "username",
      type: "text",
      displayName: "username",
      required: true,
      minLength: 5,
  },
  pwd,
]);
/* AccountsTemplates.configureRoute('signIn', {
	name: 'signin',
	path: '/login',
	redirect: '/',
	
}); */
Router.route('/login', function () {
	this.render('atForm');
	this.render('footerBar', { to: 'footer'});
});