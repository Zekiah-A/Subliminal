import { LitElement, html, css } from "lit";

/**
 * @typedef {Object} Anthology
 * @property {string} name
 * @property {string} path
 * @property {string} type
 * @property {string} [summary]
 */

/**
 * @typedef {Object} AnthologySource
 * @property {string} name
 * @property {string} baseUrl
 * @property {string} webpageUrl
 */

export class AnthologyListItem extends LitElement {
	static properties = {
		anthology: { type: Object },
		source: { type: Object }
	};

	constructor() {
		super();
		/**@type {Anthology|null}*/this.anthology = null;
		/**@type {AnthologySource|null}*/this.source = null;
	}

	static styles = css`
		:host {
			display: block;
			border-radius: 0.5rem;
			padding: 1rem;
			box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
			transition: background-color 0.3s ease;
			margin-bottom: 1rem;
		}

		details summary {
			cursor: pointer;
			font-size: 1.1rem;
			font-weight: bold;
			outline: none;
		}

		summary > a {
			text-decoration: none;
			color: #007acc;
		}

		summary > a:hover {
			text-decoration: underline;
		}

		p {
			margin: 0.5rem 0 0;
		}

		.source-link {
			margin-top: 0.5rem;
			font-size: 0.9rem;
			color: #666;
		}

		.source-link a {
			color: #444;
			text-decoration: none;
			font-weight: bold;
		}
	`;

	render() {
		if (!this.anthology || !this.source) {
			return html``;
		}
		const { name, path, type, summary } = this.anthology;
		const { baseUrl, name: sourceName, webpageUrl } = this.source;
		const anthologyUrl = new URL(baseUrl + "/" + path);

		const params = new URLSearchParams({
			url: anthologyUrl.toString(),
			sourceUrl: baseUrl,
			type: type
		});

		return html`
			<link rel="stylesheet" href="/styles.css">
			<details>
				<summary>
					<a href="/anthology?${params.toString()}">${name}</a>
					${summary ? html`<p>${summary}</p>` : null}
				</summary>
				<p class="source-link">
					From:
					<a href="${webpageUrl}" target="_blank" rel="noopener">
						${sourceName}
					</a>
				</p>
			</details>
		`;
	}
}

customElements.define("anthology-list-item", AnthologyListItem);
