"use strict";

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid
 * @property {string} message
 */

export class FormValidator {
	static #validUsernamePattern = /^[a-z][a-z0-9_.]{0,15}$/;
	static #validEmailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

	/**
	 * @param {string} username
	 * @returns {ValidationResult}
	 */
	static validateUsername(username) {
		if (username.length === 0) {
			return { isValid: false, message: "Username is required" };
		}
		
		if (!username.match(this.#validUsernamePattern)) {
			return { 
				isValid: false, 
				message: "Invalid username, usernames should be lowercase with only digit, _ and . special characters" 
			};
		}
		
		return { isValid: true, message: "" };
	}

	/**
	 * @param {string} email
	 * @returns {ValidationResult}
	 */
	static validateEmail(email) {
		if (!email.match(this.#validEmailPattern)) {
			return { isValid: false, message: "Invalid email!" };
		}
		
		return { isValid: true, message: "" };
	}

	/**
	 * @param {string} username
	 * @returns {string}
	 */
	static sanitizeUsername(username) {
		return username.replace(/\W+/g, "").toLowerCase();
	}

	/**
	 * @param {string} username
	 * @param {string} email
	 * @param {boolean} promise
	 * @returns {ValidationResult}
	 */
	static validateSignupForm(username, email, promise) {
		const usernameValidation = this.validateUsername(username);
		if (!usernameValidation.isValid) {
			return usernameValidation;
		}

		const emailValidation = this.validateEmail(email);
		if (!emailValidation.isValid) {
			return emailValidation;
		}

		if (!promise) {
			return { isValid: false, message: "You have to agree to this!" };
		}

		return { isValid: true, message: "" };
	}
}