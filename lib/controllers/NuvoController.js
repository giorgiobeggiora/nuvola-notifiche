import _ from "underscore";
import $ from "jquery";
import context from "context-utils";

export default class NuvoController {

	static browser = null;
	static nuvojs = '';
	static injectionComplete = false;

	static intializeNuvoMiddleware (context, next) {

		NuvoController.browser = cordova.InAppBrowser.open('https://nuvola.madisoft.it','_blank','location=no,zoom=no,hidden=yes,toolbar=no');

		Promise.all([
			 NuvoController.readAppFile(`assets/js/nuvo.js`),
		])
		 .then(results => {
			const [ txt ] = results;
			NuvoController.nuvojs = txt;
			const browser = NuvoController.getBrowser();
			browser.addEventListener("loadstop", NuvoController.onFirstBrowserLoadStop);
			browser.addEventListener("message", NuvoController.onBrowserMessage);
			return NuvoController.waitForInjection();
		})
		.then(()=>{ next(); })
		.catch(err => {
			console.error(NuvoController.fileError(err));
			next();
		});
	}

	static waitForInjection () {
		return new Promise((resolve) => {
			(function wait(){
				NuvoController.injectionComplete ? resolve() : setTimeout(wait, 0);
			})();
		});
	}

	static runScript (code) {
		// Chrome bug
		// There is an issue on Android since Chrome v 69.0.3497.91 that truncates the data to 10240 bytes.
		// If your callback data is greater than 10240 bytes the plugin will have an error and the callback will not be called
		// https://github.com/apache/cordova-plugin-inappbrowser/issues/402
		return new Promise((resolve, reject) => {
			const browser  = NuvoController.getBrowser();
			const timeout  = setTimeout(function () { reject('runScript() timeout - ' + code); }, 10000);
			const callback = function (values) {
				clearTimeout(timeout);
				resolve(values[0]);
			}
			browser.executeScript({code}, callback);
		});
	}

	static runCommand (code) {
		return new Promise((resolve, reject) => {
			const browser  = NuvoController.getBrowser();
			const uuid     = NuvoController.uuidv4();

			code = code.slice(0, -1);
			if (code.slice(-1) !== '(') code += ',';
			code += `'${uuid}'`;
			code += ')';

			const timeout  = setTimeout(function () { reject('runCommand() timeout - ' + code); }, 10000);
			const callback = function (msg) {
				clearTimeout(timeout);
				if (msg.data.uuid === uuid) {
					browser.removeEventListener('message', callback);
					if (!msg.data) { resolve(); return; }
					if (msg.data.error) { reject(msg.data.error); return; }
					resolve(msg.data.success);
				}
			};
			browser.addEventListener('message', callback);
			browser.executeScript({ code });
		});
	}

	static uuidv4() {
		return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}

	static isLogged () {
		return NuvoController.runCommand(`Nuvo.isLogged()`);
	}

	static onFirstBrowserLoadStop (event) {
		console.log("onFirstBrowserLoadStop()",event)
		const browser = NuvoController.getBrowser();
		browser.removeEventListener("loadstop", NuvoController.onFirstBrowserLoadStop);
		browser.addEventListener("loadstop", NuvoController.onBrowserLoadStop);

		NuvoController.runScript(`setTimeout(function(){ const toggler = document.querySelector('.navbar-toggler'); if (toggler) toggler.click(); }, 500)`)
		.then(() => { NuvoController.onBrowserLoadStop(event); })
		.catch(() => { NuvoController.onBrowserLoadStop(event); });
	}

	static onBrowserLoadStop (event) {
		console.log("onBrowserLoadStop()",event)
		const { type, url } = event;
		const browser = NuvoController.getBrowser();
		NuvoController.runScript(`
			var script = document.createElement('script');
			script.innerHTML = ${NuvoController.nuvojs};
			document.getElementsByTagName('head')[0].appendChild(script);
		`);
	}

	static readAppFile (jsUri) {
		return new Promise((resolve, reject) => {
			const filepath = `${cordova.file.applicationDirectory}www/${jsUri}`;
			window.resolveLocalFileSystemURL(filepath, function(fileEntry){
				fileEntry.file(file => {
					var reader = new FileReader();
					reader.onloadend = function(){ resolve(this.result); }
					reader.readAsText(file);
				}, reject);
    		}, reject);
		});
	}

	static fileError (fileError) {
		const err = fileError.code;
		let e = 'FILEERROR ' + err + ' ';
		switch (err) {
			case FileError.NOT_FOUND_ERR: e += 'NOT_FOUND_ERR'; break;
			case FileError.SECURITY_ERR: e += 'SECURITY_ERR'; break;
			case FileError.ABORT_ERR: e += 'ABORT_ERR'; break;
			case FileError.NOT_READABLE_ERR: e += 'NOT_READABLE_ERR'; break;
			case FileError.ENCODING_ERR: e += 'ENCODING_ERR'; break;
			case FileError.NO_MODIFICATION_ALLOWED_ERR: e += 'NO_MODIFICATION_ALLOWED_ERR'; break;
			case FileError.INVALID_STATE_ERR: e += 'INVALID_STATE_ERR'; break;
			case FileError.SYNTAX_ERR: e += 'SYNTAX_ERR'; break;
			case FileError.INVALID_MODIFICATION_ERR: e += 'INVALID_MODIFICATION_ERR'; break;
			case FileError.QUOTA_EXCEEDED_ERR: e += 'QUOTA_EXCEEDED_ERR'; break;
			case FileError.TYPE_MISMATCH_ERR: e += 'TYPE_MISMATCH_ERR'; break;
			case FileError.PATH_EXISTS_ERR: e += 'PATH_EXISTS_ERR'; break;
			default: console.error(err); break;
		}
		return e;
	}

	static onBrowserMessage (msg) {
		console.log("onBrowserMessage",msg);
		const action = msg.data.action;
		const data   = msg.data.success;
		switch (action) {
			case 'browser:hide':
				NuvoController.browser.hide();
			break;
			case 'nuvo:ready':
				NuvoController.injectionComplete = true;
			break;
			case 'nuvo:homeworks':
				// console.log({"homeworks": data});
			break;
		}
	}

	static getBrowser() {
		return NuvoController.browser;
	}

}
