(function(){
	const head = document.getElementsByTagName('head')[0];
	[
		"https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min.js",
		"https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.25.1/moment-with-locales.min.js",
	].forEach(src => {
		const script = document.createElement('script');
		script.src = src;
		head.appendChild(script);
	});
})();

(function wait(){
	if (!window.jQuery || !window.moment || !window.Nuvo) { console.log("wait"); setTimeout(wait, 0); return; }
	Nuvo.ready();
})();

window.Nuvo = class Nuvo {

	static ready () {
		Nuvo.addBackToAppButton();
		Nuvo.postAction('nuvo:ready');
	}

	static isLogged (uuid) {
		console.log("isLogged()", "uuid =", uuid)
		const loginForm = document.getElementById('login');
		if (loginForm && loginForm.tagName.toLowerCase() === 'form') return Nuvo.ok(false, uuid);
		return Nuvo.ok(true, uuid);
	}

	static addBackToAppButton () {

		const $backIcon = $(`<span>&#x25c0;</span>`);
		$backIcon.css({
			"display": "inline-block",
		    "width": "1.5em",
			"height": "1.5em",
			"line-height": "1.5em",
		});
		const $backButton = $(`<button type="button"></button>`);
		$backButton.css({
			"color": "rgba(0,0,0,0.5)",
			"background-color": "",
			"padding": "0.25rem 0.75rem",
			"margin-right": "0.5rem",
			"font-size": "1.25rem",
			"line-height": "1",
			"background-color": "transparent",
			"border": "1px solid transparent",
			"border-color": "rgba(0,0,0,0.1)",
			"border-radius": "0.25rem",
		});

		const $navbar = $('nav.navbar');
		const $loginbrand = $('.login-brand');

		($navbar.length ? $navbar: $loginbrand).prepend($backButton.append($backIcon));

		$backButton.on('click', $event => {
			Nuvo.postAction("browser:hide");
		});

	}

	static getHomeworks (howManyWeeks) {
		return new Promise((resolve, reject) => {
			howManyWeeks = howManyWeeks || 5;
			console.log("getHomeworks()",howManyWeeks)
			const now = moment();
			const monday = now.startOf('isoWeek');
			const promises = new Array(howManyWeeks);
			for (let i = 0; i < howManyWeeks; i++) {
				promises[i] = Nuvo.ajax({
					url: "/area_tutore/argomento_lezione/form/visuale-settimanale/" + monday.add(7*i, 'days').format('YYYY-MM-DD'),
				});
			}
			Promise.all(promises)
			.then(results => {
				console.log("then()",results)
				const json = {};
				const dayRegExp = /(\d+)\s([a-z]+)\s(\d+)/g;
				const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
				let day = null;
				results.forEach(args => {
					const [event, xhr] = args;
					const $html = $(xhr.responseText);
					const $content = $html.filter('#administrative-area');

					$content.find('table.compiti tr').each((i, tr) => {
						const $tr = $(tr);
						if ($tr.hasClass('titoloData')) {
							// riga con giorno
							const title = $tr.children().text();
							if (!title) return;

							let m, matches = [];

							while ((m = dayRegExp.exec(title)) !== null) {
							    // This is necessary to avoid infinite loops with zero-width matches
							    if (m.index === dayRegExp.lastIndex) { dayRegExp.lastIndex++; }
							    // The result can be accessed through the `m`-variable.
							    m.forEach((match, groupIndex) => { matches[groupIndex] = match; });
							}

							let {1: date, 2: month, 3: year} = matches;
							month = mesi.indexOf(month) + 1;
							date = Number(date);
							year = Number(year);
							day = moment({year, month, date, h:0, m:0, s:0, ms:0});

						} else {
							// riga con compiti
							const hw = $tr.children('td').map((i, td) => td.innerHTML);
							const deadline = day.format('YYYY-MM-DD');
							if (hw.length) {
								if (!json[deadline]) json[deadline] = [];
								json[deadline].push({
									scadenza: deadline,
									materia: hw[0],
									descrizione: hw[1].trim(),
									assegnati: moment(hw[2], 'DD/MM/YYYY').format('YYYY-MM-DD'),
									docente: hw[3],
								});
							};
						}
					});
				});
				Nuvo.postAction("nuvo:homeworks", json);
				resolve(json);
			})
			.catch(reject);
		});
	}

	static ajax (options) {
		return new Promise((resolve, reject) => {

			var oReq = new XMLHttpRequest();

			oReq.addEventListener("progress", updateProgress);
			oReq.addEventListener("load", transferComplete);
			oReq.addEventListener("error", transferFailed);
			oReq.addEventListener("abort", transferCanceled);

			function updateProgress (oEvent) {}
			function transferComplete (evt) { resolve([evt, oReq]); }
			function transferFailed (evt) { reject([evt, oReq]); }
			function transferCanceled (evt) { reject([evt, oReq]); }

			oReq.open("GET", options.url);
			oReq.send() ;

		});
	}

	static postJSON (json = {}) {
		console.log("postJSON()",json);
		if (!window.webkit) return;
		if (!window.webkit.messageHandlers) return;
		window.webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(json));
	}

	static postAction (action, data = {}) {
		console.log("POST ACTION", action, data)
		Nuvo.postJSON({action: action, success: data});
	}

	static ok (value, uuid) {
		Nuvo.postJSON({uuid, success: value});
		return value;
	}

	static ko (value, uuid) {
		Nuvo.postJSON({uuid, error: value});
		return value;
	}

}
