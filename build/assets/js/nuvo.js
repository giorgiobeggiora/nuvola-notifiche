(function(){
	const script = document.createElement('script');
	script.src = "https://code.jquery.com/jquery-3.5.0.min.js";
	document.getElementsByTagName('head')[0].appendChild(script);
})();

(function wait(){
	if (!window.jQuery) setTimeout(wait, 0);
	else Nuvo.ready();
})();

class Nuvo {

	static ready () {

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
		$('nav.navbar').prepend($backButton.append($backIcon));
		$backButton.on('click', $event => {
			Nuvo.postJSON({action: "browser:hide"});
		});

		Nuvo.getHomeworks().then(results => {
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

						let {1: date, 2: month, 3:year} = matches;
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
			Nuvo.postJSON({action: "homeworks", data: json});
		}).catch(console.error);

	}

	static getHomeworks (howManyWeeks) {
		howManyWeeks = howManyWeeks || 5;
		const now = moment();
		const monday = now.startOf('isoWeek');
		const promises = new Array(howManyWeeks);
		for (let i = 0; i < howManyWeeks; i++) {
			promises[i] = Nuvo.ajax({
				url: "/area_tutore/argomento_lezione/form/visuale-settimanale/" + monday.add(7*i, 'days').format('YYYY-MM-DD'),
			});
		}
		return Promise.all(promises);
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

	static postJSON (json) {
		console.log("postJSON()",json);
		if (!window.webkit) return;
		if (!window.webkit.messageHandlers) return;
		window.webkit.messageHandlers.cordova_iab.postMessage(JSON.stringify(json));
	}

}
