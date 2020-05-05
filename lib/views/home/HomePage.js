import _ from "underscore";
import $ from "jquery";
import context from "context-utils";
import {l} from "../../utils/index";

import { IosBarView  } from "backbone.uikit";
import AppPage from "../AppPage";

import NuvoController from "../../controllers/NuvoController";


export default class HomePage extends AppPage {

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

	}

	getNavigationBar() {
		return this.getSubView('navigationBarView');
	}

	getAnimationPushDuration() {
		return 0;
	}

	onRender(rendered) {
		super.onRender(rendered);

		const $content = this.getJQueryContainerElement();

		if (!rendered) {
			Promise.all([
				NuvoController.isLogged(),
			])
			.then(results => {
				const [ isLogged ] = results;
				console.log("isLogged",isLogged)
				if (!isLogged) {
					$content.append('<BUTTON>LOGIN</button>');
					return;
				}
				$content.append('<BUTTON>LOGOUT</button>');
			})
			.catch(err => {
				console.error(err);
			});

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

}
