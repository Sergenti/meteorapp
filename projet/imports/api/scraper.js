import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import puppeteer from 'puppeteer';

export const Drugs = new Mongo.Collection('drugs');

if (Meteor.isServer) {
	Meteor.publish('drugs', function drugsPublisher() {
		return Drugs.find({});
	})
}

Meteor.methods({
	'createDrug': async function (compendiumURL) {
		check(compendiumURL, String);
		let result = await scrapeDrug(compendiumURL)
		let entry = Drugs.insert({
			title: result.title,
			composition: result.composition,
			notice: result.notice
		});
		return result;
	},
	'searchDrug': async function (searchString){
		let result = await searchByString(searchString);
		return result;
	}
})

async function scrapeDrug(compendiumURL) {
	const titleSelector = '#ctl00_MainContent_ucProductDetail1_dvProduct_lblProductDescr';
	// launch puppeteer browser
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(compendiumURL);

	// await page load
	await page.waitForSelector(titleSelector);

	// get the name of the drug
	const title = await page.evaluate((selector) => {
		return document.querySelector(selector).textContent;
	}, titleSelector);

	//get the list of components to the drug
	const composition = await page.evaluate((selector) => {
		return Array.from(document.querySelectorAll(selector))
			.map((tr) => tr.textContent);
	}, '#compEverything > table > tbody > tr');

	//move to the patient information page of this drug and await page loading
	await Promise.all([
		page.waitForNavigation(),
		page.click('#ctl00_MainContent_ucProductDetail1_tblLinkMoreInfosFIPIPhoto > tbody > tr > td:nth-child(2) > a:nth-child(1)')
	]);

	//get the notice of the drug
	let notice = await page.evaluate((selector) => {
		return Array.from(document.querySelectorAll(selector))
			/* get the childnodes of each paragraphs */
			.map((paragraphe) => Array.from(paragraphe.childNodes)
				/* get the text content of each element inside a paragraph */
				.map(element => element.textContent));
	}, '.monographie > .paragraph');

	//close the headless browser
	await browser.close();

	//create return object
	const drugData = {
		title: title,
		composition: composition,
		notice: notice,
	}

	return drugData;
}

async function searchByString(searchString) {
	const newString = searchString.split(' ').join('!20');
	const searchURL = `https://compendium.ch/search/${newString}/fr`;

	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	await page.goto(searchURL);

	const trSelector = '#ctl00_MainContent_ucProductFullSearch1_gvwProducts > tbody > tr';
	// await page load
	await page.waitForSelector(trSelector);

	// get the title (e.g. dafalgan), subtitle (e.g. paracetamol), and the path to access
	// the details of the drug (that we can transform to get the compendiumURL parameter 
	// of scrapeDrug(compendiumURL))
	const searchResults = await page.evaluate((selector) => {
		return Array.from(document.querySelectorAll(selector))
			.map((resultEntry) => {
				let tdThatContainsTheInfoWeNeed = Array.from(Array.from(resultEntry.childNodes)[2].childNodes);
				let informationsContainer = Array.from(tdThatContainsTheInfoWeNeed[1].childNodes)
				const resultObject = {
					title: informationsContainer[0].textContent,
					subtitle: informationsContainer[4].textContent,
					path: tdThatContainsTheInfoWeNeed[1].pathname
				}
				return resultObject;
			});
	}, trSelector);
	//close the headless browser
	await browser.close();

	return searchResults;
}

