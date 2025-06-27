/**@typedef {"fragment"|"text"|"newline"|"bold"|"font"|"colour"} DocumentNodeType*/

export class DocumentNode {
	/**@type {DocumentNodeType}*/type
	/**@type {DocumentNode|null}*/#parent
	static validTypes = [ "fragment", "text", "newline", "bold", "font", "colour" ]

	/**
	 * @param {DocumentNodeType} type
	 */
	constructor(type) {
	    if (!DocumentNode.validTypes.includes(type)) {
			throw new Error(`Invalid type: ${type}`);
		}
		this.type = type
		this.#parent = null
	}

	get parent() {
		return this.#parent;
	}

	set parent(newParent) {
		if (newParent instanceof DocumentNode) {
			this.#parent = newParent;
		}
		else {
			throw new Error("Parent must be an instance of DocumentNode.")
		}
	}

	removeParent() {
		if (this.#parent) {
			this.#parent = null;
		}
	}

	/**
	 * @param {(arg0: DocumentNode) => void} callback
	 */
	traverse(callback) {
		callback(this)
	}
}


export class DocumentFragmentNode extends DocumentNode {
	/**@type {DocumentNode[]}*/#children

	constructor() {
		super("fragment")
		this.styles = []
		this.#children = []
	}

	get children() {
		return [...this.#children]
	}

	/**
	 * @param {(arg0: DocumentNode) => void} callback
	 */
	traverse(callback) {
		callback(this)
		this.#children.forEach(child => child.traverse(callback))
	}

	hasChildren() {
		return this.#children.length > 0
	}

	/**
	 * @param {DocumentNode} childNode
	 */
	addChild(childNode) {
		if (childNode instanceof DocumentNode) {
			childNode.parent = this;
			this.#children.push(childNode);
		}
		else {
			throw new Error("Child must be an instance of DocumentNode.");
		}
	}

	/**
	 * @param {DocumentNode} childNode 
	 */
	removeChild(childNode) {
		const index = this.#children.indexOf(childNode);
		if (index > -1) {
			this.#children.splice(index, 1);
			childNode.parent = null;
		}
		else {
			throw new Error("Child node not found.")
		}
	}
}

class TextNode extends DocumentNode {
	constructor(text="") {
		super("text")
		this.content = text
	}
}

class NewLineNode extends DocumentNode {
	constructor(count=1) {
		super("newline")
		this.count = count
	}
}
