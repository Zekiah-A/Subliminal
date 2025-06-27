import { DocumentNode } from "./nodes"

/**
 * @class Bold
 * @description Represents bold style
 */
class BoldStyle extends DocumentNode {
	constructor() {
		super("bold")
	}
}

/**
 * @class Font
 * @description Represents font style
 */
class FontStyle extends DocumentNode {
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
class ColourStyle extends DocumentNode {
	constructor(hex="#000") {
		super("colour")
		this.hex = hex
	}
}
