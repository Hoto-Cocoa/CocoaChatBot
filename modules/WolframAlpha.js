/**
 * @file WolframAlpha.js
 * @author Hoto Cocoa <cocoa@hoto.us>
 * @license AGPL-3.0
 * @param {(Number|String)} input
 */

module.exports = async input => {
	const result = JSON.parse((await require('./AsyncRequest')(`https://api.wolframalpha.com/v2/query?input=${encodeURIComponent(input)}&primary=true&appid=${require('../config').Wolfram.Token}&format=plaintext&output=json&podtitle=Result&podtitle=Decimal%20approximation&podtitle=Power%20of%2010%20representation&podtitle=Exact%20result`)));
	if(!result.queryresult.pods) return new Error('NO_RESULT');
	const value = result.queryresult.pods[0].subpods[0].plaintext;
	if(result.queryresult.pods[0].states && (result.queryresult.pods[0].states[0].name === 'More digits' || result.queryresult.pods[0].states.length > 1)) return { value, more: true };
	return { value };
}