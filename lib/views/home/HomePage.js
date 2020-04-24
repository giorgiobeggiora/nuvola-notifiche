import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import { PageView, IosBarView,  } from "backbone.uikit";
import {l} from "../../utils/index";

export default class HomePage extends PageView {

	addClass() {
		return 'home-page';
	}

	constructor(options) {
		super(options);

		// this.template = require('../../../templates/home/home.html');

		let state = this.getState();
		let navigationBarView = new IosBarView({
			state: state,
			addClass: 'back-bar',
			left: '<i class="icon-close js-close"></i>',
			center: $('<span class="title"></span>').text(l('HOME_PAGE->TITLE')),
			popViewOnBackButton: false
		});
		this.addSubView('navigationBarView', navigationBarView);

		this.listenTo(navigationBarView, 'leftClick', this.onNavigationBarLeftSideClick);

		this.readAppFile(`assets/js/nuvo.js`)
		.then(txt => {
			this.nuvojs = txt;
			var browser = this.browser = cordova.InAppBrowser.open('https://nuvola.madisoft.it','_blank','location=no,zoom=no,hidden=yes,toolbar=no');
			browser.addEventListener("loadstop", this.onFirstBrowserLoadStop.bind(this));
			browser.addEventListener("message", this.onBrowserMessage.bind(this));
		})
		.catch(err => {
			console.error(this.fileError(err));
		});

	}

	readAppFile (jsUri) {
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

	fileError (fileError) {
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

	getNavigationBar() {
		return this.getSubView('navigationBarView');
	}

	getAnimationPushDuration() {
		return 0;
	}

	onRender(rendered) {
		if (!rendered) {
			// this.$el.html(template({ model: this.model.toJSON() }));
			// const $nuvola = this.cache.$nuvola = $('<iframe class="nuvola js-nuvola" src="https://nuvola.madisoft.it"></iframe>');
			// $nuvola.on('load', $event=>{
			// 	console.log($nuvola.document);
			// 	console.log($nuvola.html());
			// 	console.log($nuvola.find('h2').html());
			// });
			// this.$el.append($nuvola);
		}
		if (this.model) {
			// Filled
		}
		else {
			// Empty
		}
	}

	onNavigationBarLeftSideClick(e) {
		this.trigger('close', e);
	}

	onBeforeActivate() {
		super.onBeforeActivate();
	}

	onActivate(firstTime) {
		super.onActivate(firstTime);
	}

	onBeforeDeactivate() {
		super.onBeforeDeactivate();
	}

	onDeactivate() {
		super.onDeactivate();
	}

	browserRunScript (code) {
		// Chrome bug
		// There is an issue on Android since Chrome v 69.0.3497.91 that truncates the data to 10240 bytes.
		// If your callback data is greater than 10240 bytes the plugin will have an error and the callback will not be called
		// https://github.com/apache/cordova-plugin-inappbrowser/issues/402
		return new Promise((resolve, reject) => {
			const timeout = setTimeout(function () { reject('browserRunScript() timeout'); }, 1000);
			this.browser.executeScript({ code }, function ( values ) { clearTimeout(timeout); resolve(values[0]); });
		});
	}

	onFirstBrowserLoadStop (event) {
		const { browser } = this;
		browser.show();
		browser.removeEventListener("loadstop", this.onFirstBrowserLoadStop.bind(this));
		browser.addEventListener("loadstop", this.onBrowserLoadStop.bind(this));

		this.browserRunScript(`setTimeout(()=>{document.querySelector('.navbar-toggler').click();},500)`)
		.then(() => { this.onBrowserLoadStop(event); })
		.catch(() => { this.onBrowserLoadStop(event); });
	}

	onBrowserLoadStop (event) {
		console.log("onBrowserLoadStop()",event)
		const { type, url } = event;
		const { browser } = this;
		this.browserRunScript(`
			var script = document.createElement('script');
			script.innerHTML = ${this.nuvojs};
			document.getElementsByTagName('head')[0].appendChild(script);
		`);
	}

	onBrowserMessage (msg) {
		console.log("message", msg);
		switch (msg.data.action) {
			case 'browser:hide':
				this.browser.hide();
			break;
			case 'homeworks':
				console.log(msg.data.data);
			break;
		}
		console.log("onBrowserMessage",msg);
	}

}
