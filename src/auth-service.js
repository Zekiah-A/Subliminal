"use strict";
import { serverBaseAddress } from "./server.js";

/**
 * @typedef {Object} SigninData
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {SigninData | null} data
 * @property {string | null} error
 */

export class AuthService {
	/**
	 * @param {string} username
	 * @param {string} email
	 * @returns {Promise<AuthResponse>}
	 */
	static async signin(username, email) {
		try {
			const response = await fetch(serverBaseAddress + "/auth/signin", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, email })
			});

			if (!response.ok) {
				return { success: false, data: null, error: "Signin response was denied." };
			}

			const data = await response.json();
			return { success: true, data, error: null };
		}
		catch (error) {
			return { 
				success: false, 
				data: null, 
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}

	/**
	 * @param {string} username
	 * @param {string} email
	 * @returns {Promise<AuthResponse>}
	 */
	static async signup(username, email) {
		try {
			const response = await fetch(serverBaseAddress + "/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ Username: username, Email: email })
			});

			if (!response.ok) {
				return { success: false, data: null, error: "Signup response was denied." };
			}

			const dataObject = await response.json();
			console.log(dataObject);
			return { success: true, data: null, error: null };
		}
		catch (error) {
			return { 
				success: false, 
				data: null, 
				error: error instanceof Error ? error.message : String(error)
			};
		}
	}
}