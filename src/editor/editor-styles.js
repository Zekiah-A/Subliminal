import { DocumentNode } from "./editor-nodes"

/**
 * @class Bold
 * @description Represents bold style
 */
export class BoldStyle extends DocumentNode {
	constructor() {
		super("bold")
		this.weight = 400;
	}
}

/**
 * @class Font
 * @description Represents font style
 */
export class FontStyle extends DocumentNode {
	constructor(name="Arial, Helvetica, sans-serif", size=18) {
		super("font")
		this.name = name
		this.size = size
	}
}

/**
 * @class Colour
 * @description Represents colour style
 */
export class ColourStyle extends DocumentNode {
	constructor(hex="#000") {
		super("colour")
		this.hex = hex
	}
}
